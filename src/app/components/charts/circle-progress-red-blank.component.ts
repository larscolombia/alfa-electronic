import { Component, ChangeDetectorRef, OnInit } from "@angular/core";
import { Location, CommonModule } from "@angular/common";
import { NgCircleProgressModule, CircleProgressOptions } from "ng-circle-progress";

@Component({
    selector: "app-circle-progress-red-blank",
    standalone: true,
    imports: [NgCircleProgressModule, CommonModule],
    providers: [
        {
            provide: CircleProgressOptions,
        },
    ],
    template: `<circle-progress [percent]="65" [space]="-6" [radius]="26" [outerStrokeWidth]="6" [innerStrokeWidth]="6" [outerStrokeColor]="'#c80036'" [innerStrokeColor]="'rgba(200, 0, 54, 0.15)'" [animation]="true" [showSubtitle]="false" [showTitle]="false" [showUnits]="false" [animationDuration]="300"></circle-progress>`,
})
export class CircleProgressRedBlankComponent implements OnInit {
    dataLoaded = false;
    constructor(private cdr: ChangeDetectorRef) {}

    ngOnInit() {
        setTimeout(() => {
            this.dataLoaded = true;
            this.cdr.detectChanges();
            window.dispatchEvent(new Event("resize"));
        }, 500);
    }
}
