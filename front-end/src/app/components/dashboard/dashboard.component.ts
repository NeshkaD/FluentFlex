import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

// Class to dynamically initialize and update the dashboard component
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

  // Constructor injects apiService, bootstrap modal module, and router module and initializes default data
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

  // Initialize the dashboard component
  ngOnInit(): void {
    // Redirect to login page if user not logged in:
    if (!this.apiService.getCurrentUser()) {
      this.router.navigate(['/login']);
    }
    // Make HTTP request to populate dashboard table with list of MP3 content items that this user owns:
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

  // Opens content deletion modal:
  openModal(template: any) {
    this.activeModal = this.ngbModal.open(template, {ariaLabelledBy: 'modal-basic-title'});
    this.activeModal.result.then((result: any) => {
      console.log(`Modal closed with result: ${result}`);
    }, (reason: any) => {
      console.log('Modal dismissed due to reason');
    });
  }

  // Log when study button is clicked:
  onClickStudyButton(event: any, content: any): void {
    console.log("Study button was clicked");
  }

  // Open content deletion modal to check if user really wants to delete their MP3 item:
  onClickDeleteButton(event: any, deck: any, popover: any): void {
    this.currentChosenContentToDelete = deck;
    this.openModal(popover);
  }

  // Send request to back-end API to delete MP3 content and request updated list from back-end to dynamically update dashboard:
  onClickConfirmDeleteButton(event: any): void {
    // HTTP deletion request:
    this.apiService.deleteContent(this.currentChosenContentToDelete.id).subscribe(
      {
        next: value => {},
        error: err => {
          console.error(`Observable for deleting contentId ${this.currentChosenContentToDelete.id} emitted an error: ${err}`);
        },
        complete: () => {
          console.log(`Observable for deleting contentId ${this.currentChosenContentToDelete.id} emitted the complete notification`);
          // HTTP Request to get the most up-to-date copy of contentInfoList from backend:
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

  // Send request to back-end API to insert MP3 demo data for this user and HTTP request updated list to dynamically update dashboard:
  onClickDemoDataButton(event: any) : void {
    // HTTP demo data request:
    this.apiService.acquireDemoData(this.userId).subscribe(
      {
        next: value => {},
        error: err => {
          console.error(`Observable for acquiring demo data emitted an error: ${err}`);
        },
        complete: () => {
          console.log('Observable for acquiring demo data emitted the complete notification');
          // HTTP Request to get the most up-to-date copy of contentInfoList from backend:
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

  // Log when quiz button is clicked:
  onClickQuizButton(event: any, deck: any): void {
    console.log("Quiz button was clicked");
  }

  // Log when upload button is clicked:
  onClickUploadButton(event: any): void {
    console.log("Upload button was clicked");
  }
}
