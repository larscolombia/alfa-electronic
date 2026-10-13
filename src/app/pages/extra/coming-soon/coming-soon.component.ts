import { Component, OnInit, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-coming-soon",
    standalone: true,
    imports: [RouterLink],
    template: `
        <!-- content -->
        <div class="container">
            <div class="auth-wrapper">
                <!--Page body-->
                <div class="coverimg h-100 w-100 top-0 start-0 position-absolute z-index-0 blur-overlay blur-theme">
                    <img src="assets/img/adminux/comingsoon.jpg" alt="" />
                </div>
                <!-- center wrap -->
                <div class="row justify-content-center align-items-center minheight-dynamic position-relative z-index-1" style="--mih-dynamic: calc(100vh - 135px)">
                    <div class="col-11 col-sm-8 col-lg-6 col-xxl-5 text-white">
                        <div class="mb-3 mb-lg-4 text-center">
                            <h1>We're coming soon...</h1>
                            <h4 class="">We are at the edge of our final release.</h4>
                        </div>
                        @if (!countdownFinished) {
                        <div class="row gx-4 gx-lg-5 align-items-center justify-content-center text-center mb-3 mb-lg-4">
                            <div class="col col-md-auto">
                                <span id="days" class="fw-bold h1">{{ days }}</span
                                ><br />
                                <small class="opacity-50">Days</small>
                            </div>
                            <div class="col col-md-auto">
                                <span id="hrs" class="fw-bold h1">{{ hours }}</span
                                ><br />
                                <small class="opacity-50">Hours</small>
                            </div>
                            <div class="col col-md-auto">
                                <span id="min" class="fw-bold h1">{{ minutes }}</span
                                ><br />
                                <small class="opacity-50">Min</small>
                            </div>
                            <div class="col col-md-auto">
                                <span id="sec" class="fw-bold h1">{{ seconds }}</span
                                ><br />
                                <small class="opacity-50">Sec</small>
                            </div>
                        </div>
                        } @if (countdownFinished) {
                        <p id="endtimer" class="mt-lg-4">{{ finishedMessage }}</p>
                        }

                        <!-- subscription -->

                        <div class="input-group maxwidth-300 mb-3 mx-auto">
                            <input type="text" class="form-control" placeholder="Your email address" />
                            <button class="btn btn-theme" type="button">Subscribe</button>
                        </div>
                        <h5 class="mb-1 text-center">Subscribe for our newsletter</h5>
                        <p class="opacity-75 text-center">You will get an email with steps and verification.</p>

                        <!-- social links -->
                        <div class="mb-3 text-center">
                            <a routerLink="/app/dashboard" class="btn btn-square btn-link text-white rounded-circle" data-toggle="tooltip" title="Dashboard"><i class="bi bi-arrow-left"></i></a>
                            <a class="btn btn-square btn-link text-white rounded-circle" target="_blank"><i class="bi bi-facebook"></i></a>
                            <a class="btn btn-square btn-link text-white rounded-circle" target="_blank"><i class="bi bi-twitter"></i></a>
                            <a class="btn btn-square btn-link text-white rounded-circle" target="_blank"><i class="bi bi-instagram"></i></a>
                            <a class="btn btn-square btn-link text-white rounded-circle" target="_blank"><i class="bi bi-linkedin"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class ComingSoonComponent implements OnInit, OnDestroy {
    days: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    countdownFinished: boolean = false;
    finishedMessage: string = "Our website is live.";
    private intervalId: any;
    private countDownDate: number;

    constructor(private location: Location) {
        this.countDownDate = new Date("October 7, 2026 18:32:25").getTime();
    }

    ngOnInit() {
        this.intervalId = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    ngOnDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private updateCountdown() {
        const now = new Date().getTime();
        const distance = this.countDownDate - now;

        if (distance < 0) {
            clearInterval(this.intervalId);
            this.countdownFinished = true;
        } else {
            this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
            this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
        }
    }

    goBack(): void {
        this.location.back();
    }
}
