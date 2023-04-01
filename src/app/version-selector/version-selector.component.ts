import { Component } from '@angular/core';
import { Version, XsdService } from '../xsd.service';

@Component({
  selector: 'app-version-selector',
  templateUrl: './version-selector.component.html',
  styleUrls: ['./version-selector.component.scss'],
})
export class VersionSelectorComponent {
  constructor(private xsd: XsdService) {}

  select(version: Version) {
    this.xsd.select(version);
  }
}
