import { Component } from "@angular/core";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { throwError } from "rxjs";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ApiService } from "../../services/api.service";

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
  status: "initial" | "uploading" | "success" | "fail" = "initial";
  mediaFile: File | null = null;
  userLanguageSrtFile: File | null = null;
  foreignLanguageSrtFile: File | null = null;
  contentLanguage : any; 
  translationLanguage : any;
  contentTitle : any;
  contentAuthor : any;
  currentUserId : any;

  constructor(private http: HttpClient, private router: Router, private apiService: ApiService) {}

  ngOnInit(): void {
    this.currentUserId = this.apiService.getCurrentUser();
    console.log(this.currentUserId);
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
    }
  }

  onChangeMediaFile(event: any) {
    const chosenFile: File = event.target.files[0];

    if (chosenFile) {
      this.status = "initial";
      this.mediaFile = chosenFile;
    }
  }

  onChangeUserLanguageSrtFile(event: any) {
    const chosenFile: File = event.target.files[0];

    if (chosenFile) {
      this.status = "initial";
      this.userLanguageSrtFile = chosenFile;
    }
  }

  onChangeForeignLanguageSrtFile(event: any) {
    const chosenFile: File = event.target.files[0];

    if (chosenFile) {
      this.status = "initial";
      this.foreignLanguageSrtFile = chosenFile;
    }
  }

  onUpload() {
    if (this.mediaFile && this.userLanguageSrtFile && this.foreignLanguageSrtFile) { // TODO: make userLanguageSrtFile optional later
      const formData = new FormData();

      formData.append("userId", this.currentUserId);
      formData.append("type", "song");
      formData.append("contentLanguage", this.contentLanguage);
      formData.append("translationLanguage", this.translationLanguage);
      // console.log(this.file.name);
      formData.append("mediaTitle", this.contentTitle);
      formData.append("mediaAuthor", this.contentAuthor);
      formData.append("media", this.mediaFile, "content-file");
      formData.append("userLangSrt", this.userLanguageSrtFile, "user-lang-srt-file");
      formData.append("foreignLangSrt", this.foreignLanguageSrtFile, "foreign-lang-srt-file");
      
      



      const upload$ = this.apiService.postUploadForm(formData);
      
      this.status = "uploading";

      upload$.subscribe({
        next: () => {
          this.status = "success";
        },
        error: (error: any) => {
          this.status = "fail";
          return throwError(() => error);
        },
      });
    }
  }
}