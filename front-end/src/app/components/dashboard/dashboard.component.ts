import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  contents: any;
  currentChosenContentToDelete: any;
  activeModal: any;
  userId: any;
  contentItemInfoList: any;

  constructor(private apiService : ApiService, private ngbModal: NgbModal, private router: Router
    ) {
      this.userId = apiService.getCurrentUser();
      this.contents = [  
        {
          name: "Content 1",
          description: "Description 1"
        },
        {
          name: "Content 2",
          description: "Description 2"
        }
      ]
    }

  ngOnInit(): void {
    if (!this.apiService.getCurrentUser()) {
      this.router.navigate(['/login']);
    }
    this.apiService.getContentItemInfoListByUserId(this.userId).subscribe(
      {
        next: value => {
          console.log(`Got content info: ${JSON.stringify(value)}`);
          this.contentItemInfoList = value;
        },
        error: err => {
          console.error(`Observable for getting contentItemInfoList for userId ${this.userId} emitted an error: ${err}`);
        },
        complete: () => console.log(`Observable for getting contentItemInfoList for userId ${this.userId} emitted the complete notification`)
      }
    );
  }

  openModal(template: any) {
    this.activeModal = this.ngbModal.open(template, {ariaLabelledBy: 'modal-basic-title'});
    this.activeModal.result.then((result: any) => {
      console.log(`Modal closed with result: ${result}`);
    }, (reason: any) => {
      console.log('Modal dismissed due to reason');
    });
  }

  onClickStudyButton(event: any, content: any): void {

  }

  onClickDeleteButton(event: any, deck: any, popover: any): void {
    this.currentChosenContentToDelete = deck;
    this.openModal(popover);
  }

  onClickConfirmDeleteButton(event: any): void {
    this.apiService.deleteContent(this.currentChosenContentToDelete.id).subscribe(
      {
        next: value => {},
        error: err => {
          console.error(`Observable for deleting contentId ${this.currentChosenContentToDelete.id} emitted an error: ${err}`);
        },
        complete: () => {
          console.log(`Observable for deleting contentId ${this.currentChosenContentToDelete.id} emitted the complete notification`);
          // Requested most up-to-date copy of contentInfoList from backend.
          this.apiService.getContentItemInfoListByUserId(this.userId).subscribe(
            {
              next: value => {
                console.log(`Got content info: ${JSON.stringify(value)}`);
                this.contentItemInfoList = value;
              },
              error: err => {
                console.error(`Observable for getting contentItemInfoList for userId ${this.userId} emitted an error: ${err}`);
              },
              complete: () => {
                console.log(`Observable for getting contentItemInfoList for userId ${this.userId} emitted the complete notification`);
                this.activeModal.close(); // close the delete modal.
              }
            }
          );
        }
      }
    );
  }

  onClickDemoDataButton(event: any) : void {
    this.apiService.acquireDemoData(this.userId).subscribe(
      {
        next: value => {},
        error: err => {
          console.error(`Observable for acquiring demo data emitted an error: ${err}`);
        },
        complete: () => {
          console.log('Observable for acquiring demo data emitted the complete notification');
          // Requested most up-to-date copy of contentInfoList from backend.
          this.apiService.getContentItemInfoListByUserId(this.userId).subscribe(
            {
              next: value => {
                console.log(`Got content info: ${JSON.stringify(value)}`);
                this.contentItemInfoList = value;
              },
              error: err => {
                console.error(`Observable for getting contentItemInfoList for userId ${this.userId} emitted an error: ${err}`);
              },
              complete: () => {
                console.log(`Observable for getting contentItemInfoList for userId ${this.userId} emitted the complete notification`);
              }
            }
          );
        }
      }
    );
  }

  onClickQuizButton(event: any, deck: any): void {
  }

  onClickUploadButton(event: any): void {
  }
}
