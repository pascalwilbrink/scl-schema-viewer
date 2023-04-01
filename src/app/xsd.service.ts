import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '../environments/environment';

export type Version = '2007B' | '2007B4';

export const VERSIONS: Version[] = ['2007B', '2007B4'];

export interface XSDElement {
  name: string;
  $ref: Element;
  children: XSDElement[];
}

export interface Node {
  $ref: Element;
  name: string;
  extendsFrom: Node | null;
  abstract: boolean;
  complex: boolean;
}

export interface ElementTree {
  nodes: Map<String, Node>;
}

@Injectable({
  providedIn: 'root',
})
export class XsdService {
  private _simpleTypes: Map<String, Element>;
  private _complexTypes: Map<String, Element>;
  private _elements: Map<String, Element>;

  private _xsd: XMLDocument | undefined;

  private _tree: ElementTree;

  private $xsd: BehaviorSubject<XMLDocument | null> =
    new BehaviorSubject<XMLDocument | null>(null);

  constructor(private http: HttpClient) {
    this._simpleTypes = new Map<String, Element>();
    this._complexTypes = new Map<String, Element>();
    this._elements = new Map<String, Element>();
    this._tree = {
      nodes: new Map<String, Node>(),
    };

    this.xsd.subscribe({
      next: (res) => {
        if (res) {
          Array.from(res.querySelectorAll('schema > simpleType')).forEach(
            (simpleType) => {
              this._simpleTypes.set(
                simpleType.getAttribute('name')!,
                simpleType
              );
            }
          );
          Array.from(res.querySelectorAll('schema > complexType')).forEach(
            (complexType) => {
              this._complexTypes.set(
                complexType.getAttribute('name')!,
                complexType
              );
            }
          );

          Array.from(res.querySelectorAll('schema > element')).forEach(
            (element) => {
              this._elements.set(element.getAttribute('name')!, element);
            }
          );

          Array.from(this._complexTypes.values()).forEach((complexType) => {
            const complexTypeName: string = complexType.getAttribute('name')!;

            this._tree.nodes.set(complexTypeName, {
              name: complexTypeName,
              $ref: complexType,
              extendsFrom: null,
              abstract: complexType.getAttribute('abstract') === 'true',
              complex: true,
            });
          });

          Array.from(this._simpleTypes.values()).forEach((simpleType) => {
            const simpleTypeName: string = simpleType.getAttribute('name')!;

            this._tree.nodes.set(simpleTypeName, {
              name: simpleTypeName,
              $ref: simpleType,
              extendsFrom: null,
              abstract: simpleType.getAttribute('abstract') === 'true',
              complex: false,
            });
          });

          Array.from(this._complexTypes.values()).forEach((complexType) => {
            const complexTypeName: string = complexType.getAttribute('name')!;

            const complexContent: Element | null = complexType.querySelector(
              ':scope > complexContent'
            );

            if (complexContent) {
              const extension: Element | null =
                complexContent.querySelector(':scope > extension');

              if (extension) {
                const base: string = extension.getAttribute('base')!;

                const extendsFrom: Element = this._complexTypes.has(base)
                  ? this._complexTypes.get(base)!
                  : this._simpleTypes.get(base)!;

                const extendsFromName: string =
                  extendsFrom.getAttribute('name')!;

                if (this._tree.nodes.has(extendsFromName)) {
                  const extendsFromNode: Node =
                    this._tree.nodes.get(extendsFromName)!;

                  this._tree.nodes.get(complexTypeName)!.extendsFrom =
                    extendsFromNode;
                }
              }
            }
          });

          Array.from(this._simpleTypes.values()).forEach((simpleType) => {
            const simpleTypeName: string = simpleType.getAttribute('name')!;

            const complexContent: Element | null = simpleType.querySelector(
              ':scope > simpleContent'
            );

            if (complexContent) {
              const extension: Element | null =
                complexContent.querySelector(':scope > extension');

              if (extension) {
                const base: string = extension.getAttribute('base')!;

                const extendsFrom: Element = this._simpleTypes.has(base)
                  ? this._simpleTypes.get(base)!
                  : this._complexTypes.get(base)!;

                const extendsFromName: string =
                  extendsFrom.getAttribute('name')!;

                if (this._tree.nodes.has(extendsFromName)) {
                  const extendsFromNode: Node =
                    this._tree.nodes.get(extendsFromName)!;

                  this._tree.nodes.get(simpleTypeName)!.extendsFrom =
                    extendsFromNode;
                }
              }
            }
          });
        }
      },
    });
  }

  get tree(): ElementTree {
    return this._tree;
  }

  select(version: Version): void {
    this.http
      .get(`${environment.baseUrl}assets/schemas/${version}.xsd`, {
        responseType: 'text',
        headers: {
          'content-type': 'application/xml',
          accept: 'application/xml',
        },
      })
      .subscribe({
        next: (res) => {
          this._xsd = new DOMParser().parseFromString(res, 'application/xml');
          this.$xsd.next(this._xsd);
        },
        error: (err) => {
          this.$xsd.error(err);
        },
      });
  }

  get xsd(): Observable<XMLDocument | null> {
    return this.$xsd.asObservable();
  }

  getNodeElements(node: Node): Element[] {
    const orderedElements: Element[] = Array.from(
      node.$ref.querySelectorAll('sequence > element')
    );
    return orderedElements;
  }

  getNodeAttributes(node: Node): Element[] {
    const attributes: Element[] = Array.from(
      node.$ref.querySelectorAll('attribute')
    );

    const attributeGroups: Element[] = Array.from(
      node.$ref.querySelectorAll('attributeGroup')
    ).flatMap((attributeGroup) =>
      Array.from(
        this._xsd!.querySelectorAll(
          `attributeGroup[name='${attributeGroup.getAttribute(
            'ref'
          )!}'] attribute`
        )
      )
    );

    return [...attributes, ...attributeGroups];
  }

  hasSimpleContent(element: Element): boolean {
    return this.getSimpleContent(element) !== null;
  }

  getSimpleContent(element: Element): Element | null {
    return element.querySelector('simpleContent');
  }

  getSimpleType(name: string): Element | null {
    return this._xsd!.querySelector(`simpleType[name='${name}']`);
  }
}
