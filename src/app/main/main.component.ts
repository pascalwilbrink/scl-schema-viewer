import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { XsdService } from '../xsd.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent {
  constructor(private xsd: XsdService, private router: Router) {
    this.xsd.xsd.subscribe({
      next: (res) => {
        if (res) {
          this.router.navigate(['/overview']);
        }
      },
    });
  }
}
