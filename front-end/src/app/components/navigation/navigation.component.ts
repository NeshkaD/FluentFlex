import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  currentUser: any;

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.currentUser = null;
  }

  ngOnInit(): void {
    this.currentUser = this.apiService.getCurrentUser();
    this.router.events.subscribe(() => {this.currentUser = this.apiService.getCurrentUser();});
  }

  onClickLogoutButton(event: any): void {
    this.apiService.logOut();
    this.router.navigate(['/login']);
  }
}