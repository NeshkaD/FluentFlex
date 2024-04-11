import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

enum LoginState {
  NotAttempted,
  LoggingIn,
  FailedCredentials,
  FailedServer
}

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

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.loginState = LoginState.NotAttempted;
  }

  ngOnInit(): void { }

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