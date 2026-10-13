import { Component, ChangeDetectorRef, OnInit } from "@angular/core";
import { Location, CommonModule } from "@angular/common";
import { NgCircleProgressModule, CircleProgressOptions } from "ng-circle-progress";

@Component({
    selector: "app-circle-progress-blue",
    standalone: true,
    imports: [NgCircleProgressModule, CommonModule],
    providers: [
        {
            provide: CircleProgressOptions,
        },
    ],
    template: `<circle-progress [percent]="65" [space]="-6" [radius]="24" [outerStrokeWidth]="6" [innerStrokeWidth]="6" [outerStrokeColor]="'#0249e8'" [innerStrokeColor]="'rgba(0, 73, 232, 0.15)'" [animation]="true" [showSubtitle]="false" [titleFontSize]="'16px'" [titleColor]="'#0249e8'" [unitsColor]="'#0249e8'" [animationDuration]="300"></circle-progress>`,
})
export class CircleProgressBlueComponent implements OnInit {
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
