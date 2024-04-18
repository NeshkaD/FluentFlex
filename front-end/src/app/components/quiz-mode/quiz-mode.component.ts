import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafePipe } from 'safe-pipe';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-mode',
  standalone: true,
  imports: [FormsModule, SafePipe, CommonModule],
  templateUrl: './quiz-mode.component.html',
  styleUrl: './quiz-mode.component.scss'
})
export class QuizModeComponent {
  userInputAnswer: any;
  contentItemInfo : any;
  userLanguage : string
  srtDetails : any;
  audioSource : string = "";
  @ViewChild('audioTag') audioTag!: ElementRef<HTMLAudioElement>;
  startTimeMilliseconds : number;
  endTimeMilliseconds : number;
  currentSrtDetailIndex : any;
  isPlaying : boolean;
  isPlayerTimeoutSet : boolean;
  isQuizComplete: boolean = false;
  isAnswerShowing: boolean = false;
  canUpdateAnswer: boolean = true;
  isLastAnswerCorrect = false;

  constructor(private activatedRoute: ActivatedRoute, private apiService : ApiService, private router: Router) {
    this.startTimeMilliseconds = 0;
    this.endTimeMilliseconds = 0;
    this.currentSrtDetailIndex = 0;
    this.isPlaying = false;
    this.isPlayerTimeoutSet = false;
    this.userLanguage = "English";
  }

  ngOnInit(): void {
    if (!this.apiService.getCurrentUser()) { // TODO: check if current user owns content.
      this.router.navigate(['/login']);
    }
    
    let contentItemId = this.activatedRoute.snapshot.paramMap.get('id');

    console.log(`Initializing quiz mode for contentItemId ${contentItemId}`);
    this.apiService.getContentItemInfoByContentId(contentItemId).subscribe(
      {
        next: value => {
          console.log(`Got content info: ${JSON.stringify(value)}`);
          this.contentItemInfo = value;
          console.log(this.contentItemInfo.id);
          this.audioSource = `http://localhost:8080/content/${this.contentItemInfo.id}`;
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

  seekAndPlay(startTime: any, endTime: any) {
    console.log(`seekAndPlay called with startTime ${startTime} and endTime ${endTime}`);
    this.startTimeMilliseconds = startTime;
    this.endTimeMilliseconds = endTime;
    this.audioTag.nativeElement.pause();
    this.audioTag.nativeElement.currentTime = startTime/1000; // TODO: See if we can use Renderer2 instead of nativeElement per docs
    console.log(`currentTime: ${this.audioTag.nativeElement.currentTime}`);
    console.log(`currentSrc: ${this.audioTag.nativeElement.currentSrc}`);
    this.audioTag.nativeElement.play();
  }

  onClickPlayButton(event: any): void {
    this.seekAndPlay(
      this.srtDetails[this.contentItemInfo.language][this.currentSrtDetailIndex].timestamp_start,
      this.srtDetails[this.contentItemInfo.language][this.currentSrtDetailIndex].timestamp_end
    );
  }

  onAudioPlaying(): void {
    console.log('playing event received');
    this.isPlaying = true;
  }

  onAudioTimeUpdate(): void {
    console.log(`timeupdate event received and isPlaying==${this.isPlaying} and isPlayerTimeoutSet==${this.isPlayerTimeoutSet}`);
    if(this.isPlaying && !this.isPlayerTimeoutSet) {
      this.isPlayerTimeoutSet = true;
      setTimeout(() => {
        this.isPlaying = false;
        this.isPlayerTimeoutSet = false;
        this.audioTag.nativeElement.pause()
      }, this.endTimeMilliseconds - this.startTimeMilliseconds);
    }
  }

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

  populateTranslationLanguageName() {
    for (let languageName in this.srtDetails) {
      if (languageName !== this.contentItemInfo.language) {
        this.userLanguage = languageName;
      }
    }
  }

  onSubmitAnswer() {
    // TODO: disable the Submit button and re-enable when http call completes.
    this.canUpdateAnswer = false;
    this.isAnswerShowing = true;
    let actualCorrectAnswer = this.srtDetails[this.contentItemInfo.language][this.currentSrtDetailIndex].line;
    this.isLastAnswerCorrect = this.isCorrectlyAnswered(actualCorrectAnswer, this.userInputAnswer);
    this.srtDetails[this.contentItemInfo.language][this.currentSrtDetailIndex].attempts++;
    if (this.isLastAnswerCorrect) {
      this.srtDetails[this.contentItemInfo.language][this.currentSrtDetailIndex].score++;
    }
    this.apiService.submitAnswer(this.srtDetails[this.contentItemInfo.language][this.currentSrtDetailIndex].id, this.isLastAnswerCorrect).subscribe({
      next: value => {
        console.log(value);
      },
      error: err => {
        console.log(err);
      },
      complete: () => {
        console.log('Observable for submitting answer completed.');
      }
    });
  }

  nextQuestion() {
    this.isAnswerShowing = false;
    this.userInputAnswer = "";
    this.currentSrtDetailIndex = (this.currentSrtDetailIndex + 1) % this.srtDetails[this.contentItemInfo.language].length;
    if(this.currentSrtDetailIndex === 0) {
      this.showResults();
    }
    this.canUpdateAnswer = true;
  }

  isCorrectlyAnswered(expectedAnswer: string, providedAnswer: string) : boolean {
    let expectedAnswerSimplified = expectedAnswer.toLocaleLowerCase('en-US')
      .replaceAll(/\s+/gi, " ")
      .replaceAll(/[^A-Za-zŽžÀ-ÿ\s]/gi, ""); // TODO: confirm that this list of punctuation is complete.
    let providedAnswerSimplified = providedAnswer.toLocaleLowerCase('en-US')
      .replaceAll(/\s+/gi, " ")
      .replaceAll(/[^A-Za-zŽžÀ-ÿ\s]/gi, ""); // TODO: confirm that this list of punctuation is complete.
    console.log(expectedAnswerSimplified);
    console.log(providedAnswerSimplified);
    return this.equalsIgnoreCaseAndAccents(expectedAnswerSimplified, providedAnswerSimplified);
  }

  showResults() {
    this.isQuizComplete = true;
  }

  restartQuiz() {
    this.router.navigateByUrl('/', {skipLocationChange:true}).then(()=>this.router.navigate([`/quiz/${this.contentItemInfo.id}`]));
  }

  equalsIgnoreCaseAndAccents(string1: string, string2: string) : boolean {
    return string1.localeCompare(string2, 'en', { sensitivity: 'base' }) === 0; // TODO: investigate locale options other than 'en'.
  }
}