import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "../../../shared/components/navbar/navbar";
import { Footer } from "../../../shared/components/footer/footer";

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {

}
