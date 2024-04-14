import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})

export class SignUpComponent {
  username = '';
  password = '';
  email = '';
  errorMessageFromServer = '';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  signUp(): void {
    console.log(`SignUpComponent::signUp called. username=${this.username};password=${this.password};email=${this.email}`); // TODO: Delete this!

    this.apiService.createAccount(this.username, this.password, this.email).subscribe(
      {
        next: value => {
          console.log(`Create account http request returned: ${JSON.stringify(value)}`);
          if (value.success) {
            this.router.navigate(['/login']);
          } else {
            this.errorMessageFromServer = value.error;
          }
        },
        error: err => {
          console.log(`Create account http request failed. Error was: ${err}`);
          this.errorMessageFromServer = 'Failed to reach server. Please check your connection.'
        },
        complete: () => console.log(`Observable for creating account emitted the complete notification`)
      }
    );
  }

}