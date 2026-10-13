import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-red-chartjs-200",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-red-chartjs-200"></canvas>`,
})
export class AreaRedChartjs200Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myred200Chart!: Chart;

    ngAfterViewInit() {
        this.red200chart();

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
    red200chart() {
        const areachartred200 = document.getElementById("app-area-red-chartjs-200") as HTMLCanvasElement;
        const ctxred200 = areachartred200.getContext("2d"); // Get the 2D rendering context
        if (ctxred200) {
            const gradientred200 = ctxred200.createLinearGradient(0, 0, 0, 170);
            gradientred200.addColorStop(0, "rgba(200, 0, 54, 0.75)");
            gradientred200.addColorStop(0.9, "rgba(200, 0, 54, 0.0)");
            this.myred200Chart = new Chart(areachartred200, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientred200,
                            borderColor: "#c80036",
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
                            display: true,
                            beginAtZero: true,
                            grid: {
                                display: false,
                            },
                        },
                        x: {
                            display: true,
                            grid: {
                                display: false,
                            },
                        },
                    },
                },
            });
        }
    }
    randomizeChart() {
        if (this.myred200Chart) {
            this.myred200Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myred200Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
