import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-red-chartjs-60",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-red-chartjs-60"></canvas>`,
})
export class ArearedChartjs60Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myred60Chart!: Chart;

    ngAfterViewInit() {
        this.redchart();

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
    redchart() {
        const areachartred60 = document.getElementById("app-area-red-chartjs-60") as HTMLCanvasElement;
        const ctxred60 = areachartred60.getContext("2d"); // Get the 2D rendering context
        if (ctxred60) {
            const gradientred60 = ctxred60.createLinearGradient(0, 0, 0, 60);
            gradientred60.addColorStop(0, "rgba(200, 0, 54, 0.75)");
            gradientred60.addColorStop(0.95, "rgba(200, 0, 54, 0.0)");
            this.myred60Chart = new Chart(areachartred60, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientred60,
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
        if (this.myred60Chart) {
            this.myred60Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myred60Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
