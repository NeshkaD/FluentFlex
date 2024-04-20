import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

// Class to dynamically initialize and update the Navigation bar
@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  currentUser: any;

  // Inject ApiService and router dependencies
  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.currentUser = null;
  }

  // Initialize state of navbar
  ngOnInit(): void {
    this.currentUser = this.apiService.getCurrentUser();
    this.router.events.subscribe(() => {this.currentUser = this.apiService.getCurrentUser();});
  }

  // Redirect to Login component on logout
  onClickLogoutButton(event: any): void {
    this.apiService.logOut();
    this.router.navigate(['/login']);
  }
}