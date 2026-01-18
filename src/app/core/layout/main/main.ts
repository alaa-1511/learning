import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../../shared/components/footer/footer';
import { SubscriptionService } from '../../service/subscription.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [ Navbar ,RouterOutlet ,Footer, CommonModule],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  constructor(public subscriptionService: SubscriptionService) {}
}
