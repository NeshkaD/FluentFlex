import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { SafePipe } from 'safe-pipe';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-study-mode',
  standalone: true,
  imports: [SafePipe, CommonModule, RouterModule],
  templateUrl: './study-mode.component.html',
  styleUrl: './study-mode.component.scss'
})
export class StudyModeComponent {
  contentItemInfo : any;
  userLanguage : string;
  srtDetails : any;
  audioSource : string = "";
  // private audioObj: HTMLAudioElement = this.renderer.;
  // audio: any;
  @ViewChild('audioTag') audioTag!: ElementRef<HTMLAudioElement>;
  startTimeMilliseconds : number;
  endTimeMilliseconds : number;
  isPlaying : boolean;
  isPlayerTimeoutSet : boolean;
  isPlayButtonEnabled : boolean;
  lineIndexSelected: number;

  constructor(private activatedRoute: ActivatedRoute, private apiService : ApiService, private router: Router) {
    this.startTimeMilliseconds = 0;
    this.endTimeMilliseconds = 0;
    this.isPlaying = false;
    this.isPlayerTimeoutSet = false;
    this.userLanguage = "English";
    this.isPlayButtonEnabled = true;
    this.lineIndexSelected = 0;
  }

  // Send HTTP requests to backend to obtain SRT lines and audio file
  ngOnInit(): void {
    if (!this.apiService.getCurrentUser()) { // TODO: check if current user owns content.
      this.router.navigate(['/login']);
    }
    let contentItemId = this.activatedRoute.snapshot.paramMap.get('id');
    console.log(`Initializing study mode for contentItemId ${contentItemId}`);
    this.apiService.getContentItemInfoByContentId(contentItemId).subscribe(
      {
        next: value => {
          console.log(`Got content info: ${JSON.stringify(value)}`);
          this.contentItemInfo = value;
          console.log(this.contentItemInfo.id);
          this.audioSource = this.apiService.getAudioSourceUrl(this.contentItemInfo.id);
          this.apiService.getSrtDetailsByContentItemId(contentItemId).subscribe(
            {
              next: value => {
                console.log(`Got srtDetails: ${JSON.stringify(value)}`);
                this.srtDetails = value;
                this.populateTranslationLanguageName();
              },
              error: err => {
                console.error(`Observable for getting srtDetails for contentItem ${contentItemId} emitted an error: ${err}`);
              },
              complete: () => console.log(`Observable for getting srtDetails for contentItem ${contentItemId} emitted the complete notification`)
            }
          );
        },
        error: err => {
          console.error(`Observable for getting contentItemInfo for contentItem ${contentItemId} emitted an error: ${err}`);
        },
        complete: () => console.log(`Observable for getting contentItemInfo for contentItem ${contentItemId} emitted the complete notification`)
      }
    );
  }

  // Play the audio between the given timestamps
  seekAndPlay(startTime: any, endTime: any) {
    console.log(`seekAndPlay called with startTime ${startTime} and endTime ${endTime}`);
    this.startTimeMilliseconds = startTime;
    this.endTimeMilliseconds = endTime;
    this.audioTag.nativeElement.pause();
    this.audioTag.nativeElement.currentTime = startTime/1000;
    console.log(`currentTime: ${this.audioTag.nativeElement.currentTime}`);
    console.log(`currentSrc: ${this.audioTag.nativeElement.currentSrc}`);
    this.audioTag.nativeElement.play();
  }

  // React to click event on play button
  onClickPlayButton(event: any, srtDetail: any, index: number): void {
    if(this.isPlayButtonEnabled) {
      this.lineIndexSelected = index;
      this.isPlayButtonEnabled = false;
      this.seekAndPlay(srtDetail.timestamp_start, srtDetail.timestamp_end);
    }
  }

  // Update audio playing flag to true when audio is playing
  onAudioPlaying(): void {
    console.log('playing event received');
    this.isPlaying = true;
  }

  // Update flags and set timer to ensure audio stops at correct timestamp
  onAudioTimeUpdate(): void {
    console.log(`timeupdate event received and isPlaying==${this.isPlaying} and isPlayerTimeoutSet==${this.isPlayerTimeoutSet}`);
    if(this.isPlaying && !this.isPlayerTimeoutSet) {
      this.isPlayerTimeoutSet = true;
      setTimeout(() => {
        this.isPlaying = false;
        this.isPlayerTimeoutSet = false;
        this.audioTag.nativeElement.pause();
        this.isPlayButtonEnabled = true;
      }, this.endTimeMilliseconds - this.startTimeMilliseconds);
    }
  }

  // Helper method to convert timestamps to human-readable format
  convertMillisecondsToTimestamp(milliseconds : number){
    let hour = Math.floor(milliseconds/3600000).toString();
    let remainder = milliseconds % 3600000;
    let minute = Math.floor(remainder/60000).toString();
    remainder = remainder % 60000;
    let second = Math.floor(remainder/1000).toString();
    remainder = remainder % 1000;
    let milli = Math.floor(remainder).toString();
    if (hour.length < 2) {
      hour = "0" + hour;
    }
    if (minute.length < 2) {
      minute = "0" + minute;
    }
    if (second.length < 2) {
      second = "0" + second;
    }
    while (milli.length < 3){
      milli = milli + "0";
    }
    let timestamp = `${minute}:${second}.${milli}`;
    if (hour !== "00") {
      timestamp = hour + ":" + timestamp;
    }
    return timestamp;
  }

  // Helper method to populate the tranlation langauge name in the table
  populateTranslationLanguageName() {
    for (let languageName in this.srtDetails) {
      if (languageName !== this.contentItemInfo.language) {
        this.userLanguage = languageName;
      }
    }
  }
}
