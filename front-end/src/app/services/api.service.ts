import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

let baseUrl = 'http://localhost:8080' // IP address and port or domain name of back-end API.

// Service class to provide util methods for making HTTP requests to the back-end REST API.
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  currentUser: any // ID of currently logged in user

  // Constructor injects HttpClient dependency
  constructor(private http: HttpClient) { }

  // Make HTTP request to create a new account
  createAccount(username: any, password: any, email: any) : Observable<any> {
    return this.http.post(`${baseUrl}/user`, {username: username, password: password, email: email});
  }

  // Make HTTP request to authenticate and log in
  logIn(username: any, password: any) : Observable<any> {
    return this.http.post(`${baseUrl}/user/authenticate`, {username: username, password: password});
  }

  // Log out the currently logged in user
  logOut() {
    this.setCurrentUser(null);
  }

  // Make HTTP request to get a list of all MP3 content items and their information relating to the given user ID
  getContentItemInfoListByUserId(userId: any) : Observable<any> {
    return this.http.get(`${baseUrl}/user/${userId}/contentinfolist`); // TODO: redesign to use URL query parameters on content controller
  }

  // Make HTTP request to get info about the MP3 content item with the given ID.
  getContentItemInfoByContentId(contentItemId: any) : Observable<any> {
    return this.http.get(`${baseUrl}/content/${contentItemId}/info`); // TODO: redesign to use URL query parameters on content controller
  }

  // Make HTTP request to get all SRT file lines relating to the given MP3 content item ID.
  getSrtDetailsByContentItemId(contentItemId: any) : Observable<any> {
    return this.http.get(`${baseUrl}/content/${contentItemId}/srtdetails`); // TODO: redesign to use URL query parameters on content controller
  }

  // Make HTTP request to submit a correct or incorrect answer so that the back-end server can update the attempt count and score in the database
  submitAnswer(srtDetailId: any, isCorrectAnswer: boolean): Observable<any> {
    return this.http.patch(`${baseUrl}/content/srtdetail/answer`, {srtDetailId: srtDetailId, isCorrectAnswer: isCorrectAnswer});
  }

  // Make HTTP request to delete the MP3 and SRT files from the data base for the content item with the given ID
  deleteContent(contentItemId: any) : Observable<any> {
    return this.http.delete(`${baseUrl}/content/${contentItemId}`);
  }

  // Set the curently logged in user
  setCurrentUser(currentUserId: any) {
    this.currentUser = currentUserId;
  }

  // Get the currently logged in user
  getCurrentUser(): any {
    return this.currentUser;
  }

  // Make HTTP request to save a copy of the demo data to the database for the given user
  acquireDemoData(userId: number): Observable<any> {
    return this.http.post(`${baseUrl}/content/demo-content`, {userId: userId});
  }

  // Get the URL for getting audio from the back-end API
  getAudioSourceUrl(contentId: number) {
    return `${baseUrl}/content/${contentId}`;
   }
 
   // Make HTTP request to post new MP3 and SRT files to the back-end server
   postUploadForm(formData: any): Observable<any> {
     return this.http.post(`${baseUrl}/content`, formData);
   }
}
