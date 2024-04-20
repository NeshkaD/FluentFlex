import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

// Possible states for a pending login request
enum LoginState {
  NotAttempted,
  LoggingIn,
  FailedCredentials,
  FailedServer
}

// Class to dynamically initialize and update the Login component
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent implements OnInit {
  loginState: LoginState;
  username = '';
  password = '';

  // Constructor injects apiService and router module. Initializes default state.
  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.loginState = LoginState.NotAttempted;
  }

  // Empty method required by Angular
  ngOnInit(): void { }

  // Send HTTP login request to back-end
  login(): void {
    if (this.username == "" || this.password == "") {
      this.loginState = LoginState.FailedCredentials;
    }
    else {
      this.loginState = LoginState.LoggingIn;
      this.apiService.logIn(this.username, this.password).subscribe(
        {
          next: value => {
            console.log(`Result of login is: ${JSON.stringify(value)}`);
            if (value.isAuthenticated) {
              this.apiService.setCurrentUser(value.userId);
              this.router.navigate(['/dashboard']);
            }
            else {
              console.log('credentials failed authentication. Please try again.');
              this.loginState = LoginState.FailedCredentials;
            }
          },
          error: err => {
            console.log(`Login failed with error: ${err}`);
            this.loginState = LoginState.FailedServer;
          },
          complete: () => console.log(`Observable for logging in emitted the complete notification`)
        }
      );
    }
  }

}