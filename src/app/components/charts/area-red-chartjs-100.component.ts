import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-red-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-red-chartjs-100"></canvas>`,
})
export class AreaRedChartjs100Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myredChart!: Chart;

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
        const areachartred = document.getElementById("app-area-red-chartjs-100") as HTMLCanvasElement;
        const ctxred = areachartred.getContext("2d"); // Get the 2D rendering context
        if (ctxred) {
            const gradientred = ctxred.createLinearGradient(0, 0, 0, 100);
            gradientred.addColorStop(0, "rgba(200, 0, 54, 0.75)");
            gradientred.addColorStop(0.95, "rgba(200, 0, 54, 0.0)");
            this.myredChart = new Chart(areachartred, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientred,
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
        if (this.myredChart) {
            this.myredChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myredChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
