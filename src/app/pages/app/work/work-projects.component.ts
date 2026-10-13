import { Component } from "@angular/core";
import { ProjectsBoardComponent } from "../projects/projects-board.component";

@Component({
    selector: "app-work-projects",
    standalone: true,
    imports: [ProjectsBoardComponent],
    template: ` <app-projects-board></app-projects-board> `,
})
export class WorkProjectsComponent {}