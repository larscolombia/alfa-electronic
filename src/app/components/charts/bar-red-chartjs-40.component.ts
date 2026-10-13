import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-bar-red-chartjs-40",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="bar-red-chartjs-40"></canvas>`,
})
export class BarRedChartjs40Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mybarred40Chart!: Chart;

    ngAfterViewInit() {
        this.barred40chart();

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
    barred40chart() {
        const areachartbarred40 = document.getElementById("bar-red-chartjs-40") as HTMLCanvasElement;
        const ctxbarred40 = areachartbarred40.getContext("2d"); // Get the 2D rendering context
        if (ctxbarred40) {
            this.mybarred40Chart = new Chart(areachartbarred40, {
                type: "bar",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "rgba(200, 0, 54, 0.3)",
                            borderWidth: 0,
                            borderRadius: 4,
                            borderSkipped: false,
                            barThickness: 4,
                        } as any,
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            backgroundColor: "#c80036",
                            borderWidth: 0,
                            borderRadius: 4,
                            borderSkipped: false,
                            barThickness: 4,
                        } as any,
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: -10,
                        },
                    },
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
        if (this.mybarred40Chart) {
            this.mybarred40Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mybarred40Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
