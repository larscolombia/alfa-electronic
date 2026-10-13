import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-blue-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-blue-chartjs-100"></canvas>`,
})
export class AreaBlueChartjs100Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myblue100Chart!: Chart;

    ngAfterViewInit() {
        this.blue100chart();

        this.intervalId = setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    blue100chart() {
        const areachartblue100 = document.getElementById("app-area-blue-chartjs-100") as HTMLCanvasElement;
        const ctxblue100 = areachartblue100.getContext("2d"); // Get the 2D rendering context
        if (ctxblue100) {
            const gradientblue100 = ctxblue100.createLinearGradient(0, 0, 0, 100);
            gradientblue100.addColorStop(0, "rgba(0, 73,232, 0.75)");
            gradientblue100.addColorStop(0.95, "rgba(0, 73,232, 0.0)");
            this.myblue100Chart = new Chart(areachartblue100, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientblue100,
                            borderColor: "#0049e8",
                            borderWidth: 1,
                            fill: true,
                            tension: 0.4,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            display: false,
                            beginAtZero: true,
                        },
                        x: {
                            display: false,
                        },
                    },
                },
            });
        }
    }
    randomizeChart() {
        if (this.myblue100Chart) {
            this.myblue100Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myblue100Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
