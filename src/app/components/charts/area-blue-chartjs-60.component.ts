import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-blue-chartjs-60",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-blue-chartjs-60"></canvas>`,
})
export class AreaBlueChartjs60Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myblue60Chart!: Chart;

    ngAfterViewInit() {
        this.blue60chart();

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
    blue60chart() {
        const areachartblue60 = document.getElementById("app-area-blue-chartjs-60") as HTMLCanvasElement;
        const ctxblue60 = areachartblue60.getContext("2d"); // Get the 2D rendering context
        if (ctxblue60) {
            const gradientblue60 = ctxblue60.createLinearGradient(0, 0, 0, 60);
            gradientblue60.addColorStop(0, "rgba(0, 73,232, 0.85)");
            gradientblue60.addColorStop(0.95, "rgba(0, 73,232, 0.0)");
            this.myblue60Chart = new Chart(areachartblue60, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientblue60,
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
        if (this.myblue60Chart) {
            this.myblue60Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myblue60Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
