import { Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-footer',
  imports: [TranslateModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {

}
