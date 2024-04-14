import { Routes } from '@angular/router';
import {QuizModeComponent} from './components/quiz-mode/quiz-mode.component';
import {StudyModeComponent} from './components/study-mode/study-mode.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UploadComponent } from './components/upload/upload.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

export const routes: Routes = [
    { path: '', component: LoginComponent},
    { path: 'study/:id', component: StudyModeComponent },
    { path: 'quiz/:id', component: QuizModeComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignUpComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'upload', component: UploadComponent },
    {
        path: '**',
        component: NotFoundComponent,
        pathMatch: 'full'
    }
];
