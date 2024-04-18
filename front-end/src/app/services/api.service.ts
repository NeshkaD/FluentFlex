import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

let baseUrl = 'http://18.236.72.140:8080'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  currentUser: any

  constructor(private http: HttpClient) { }

  createAccount(username: any, password: any, email: any) : Observable<any> {
    return this.http.post(`${baseUrl}/user`, {username: username, password: password, email: email});
  }

  logIn(username: any, password: any) : Observable<any> {
    return this.http.post(`${baseUrl}/user/authenticate`, {username: username, password: password});
  }

  logOut() {
    this.setCurrentUser(null);
  }

  getContentItemInfoListByUserId(userId: any) : Observable<any> {
    return this.http.get(`${baseUrl}/user/${userId}/contentinfolist`); // TODO: redesign to use URL query parameters on content controller
  }

  getContentItemInfoByContentId(contentItemId: any) : Observable<any> {
    return this.http.get(`${baseUrl}/content/${contentItemId}/info`); // TODO: redesign to use URL query parameters on content controller
  }

  getSrtDetailsByContentItemId(contentItemId: any) : Observable<any> {
    return this.http.get(`${baseUrl}/content/${contentItemId}/srtdetails`); // TODO: redesign to use URL query parameters on content controller
  }

  submitAnswer(srtDetailId: any, isCorrectAnswer: boolean): Observable<any> {
    return this.http.patch(`${baseUrl}/content/srtdetail/answer`, {srtDetailId: srtDetailId, isCorrectAnswer: isCorrectAnswer});
  }

  deleteContent(contentItemId: any) : Observable<any> {
    return this.http.delete(`${baseUrl}/content/${contentItemId}`);
  }

  setCurrentUser(currentUserId: any) {
    this.currentUser = currentUserId;
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  acquireDemoData(userId: number): Observable<any> {
    return this.http.post(`${baseUrl}/content/demo-content`, {userId: userId});
  }

  getAudioSourceUrl(contentId: number) {
    return `${baseUrl}/content/${contentId}`;
   }
 
   postUploadForm(formData: any): Observable<any> {
     return this.http.post(`${baseUrl}/content`, formData);
   }
}
