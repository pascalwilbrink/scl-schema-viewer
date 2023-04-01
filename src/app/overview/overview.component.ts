import { FlatTreeControl, NestedTreeControl } from '@angular/cdk/tree';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { XsdService, Node } from '../xsd.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent {
  treeControl: FlatTreeControl<Node>;

  dataSource: MatTreeNestedDataSource<Node>;

  nodes: Node[] = [];

  filteredNodes: Node[] = [];

  dataSourceFilterForm: FormGroup;

  selectedNode: Node | undefined;

  constructor(
    private xsd: XsdService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.dataSourceFilterForm = this.fb.group({
      filter: new FormControl(''),
    });

    this.dataSourceFilterForm.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(500))
      .subscribe({
        next: (res) => {
          const filter: string = this.dataSourceFilterForm.get('filter')?.value;

          if (!filter) {
            this.filteredNodes = this.nodes;
            this.dataSource.data = this.filteredNodes;
            return;
          }

          this.filteredNodes = this.nodes.filter((node) =>
            node.name.includes(filter)
          );
          console.log(this.filteredNodes);
          this.dataSource.data = this.filteredNodes;
        },
      });

    this.dataSource = new MatTreeNestedDataSource();

    this.treeControl = new NestedTreeControl<Node>((node) =>
      node.extendsFrom ? [node.extendsFrom] : []
    );

    this.xsd.xsd.subscribe({
      next: (res) => {
        if (!res) {
          this.router.navigate(['/select-version']);
          return;
        }

        this.nodes = Array.from(this.xsd.tree.nodes.values()).filter(
          (node) => !node.abstract
        );

        this.filteredNodes = this.nodes;

        this.dataSource.data = this.filteredNodes;
      },
    });
  }

  prettyName(node: Node): string {
    return node.name.startsWith('t') ? node.name.substring(1) : node.name;
  }

  hasChild = (_: number, _nodeData: Node) => _nodeData.extendsFrom;

  selectNode(node: Node) {
    this.selectedNode = node;
    console.log('node: ', node);
  }

  selectNodeViaElement(element: Element) {
    const name: string = element.hasAttribute('type')
      ? element.getAttribute('type')!
      : element.getAttribute('name')!;

    this.selectNode(this.nodes.find((node) => node.name === name)!);
  }

  get nodeTreeAttributes(): Element[] {
    if (!this.selectedNode) {
      return [];
    }
    const nodeTree: Node[] = this.getNodeTree(this.selectedNode);

    return nodeTree.flatMap((nodeTreeElement) => {
      return this.xsd.getNodeAttributes(nodeTreeElement);
    });
  }

  get nodeTreeElements(): Element[] {
    if (!this.selectedNode) {
      return [];
    }
    const nodeTree: Node[] = this.getNodeTree(this.selectedNode);

    return nodeTree.flatMap((nodeTreeElement) => {
      return this.xsd.getNodeElements(nodeTreeElement);
    });
  }

  private getNodeTree = (node: Node): Node[] => {
    const getExtendsFromNode = (node: Node): Node | null => node.extendsFrom;

    let parentNode: Node | null = node;

    const nodeTree: Node[] = [];

    nodeTree.push(node);

    while (parentNode?.extendsFrom != null) {
      parentNode = getExtendsFromNode(parentNode);
      if (parentNode) {
        nodeTree.push(parentNode);
      }
    }

    return nodeTree.reverse();
  };

  hasTextContent(node: Node): boolean {
    return node.complex ? this.xsd.hasSimpleContent(node.$ref) : true;
  }

  getSimpleContent(node: Node): Element {
    return node.complex ? this.xsd.getSimpleContent(node.$ref)! : node.$ref;
  }

  getSimpleType(node: Node): Element {
    const simpleContent: Element = this.getSimpleContent(node);
    const extension: Element | null = simpleContent.querySelector('extension');
    if (extension) {
      const base: string | null = extension.getAttribute('base');
      if (base) {
        return this.xsd.getSimpleType(base)!;
      }
    }
    return simpleContent;
  }
}
