import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-cyan-chartjs-60",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-cyan-chartjs-60"></canvas>`,
})
export class AreaCyanChartjs60Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    mycyan60Chart!: Chart;

    ngAfterViewInit() {
        this.cyan60chart();

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
    cyan60chart() {
        const areachartcyan60 = document.getElementById("app-area-cyan-chartjs-60") as HTMLCanvasElement;
        const ctxcyan60 = areachartcyan60.getContext("2d"); // Get the 2D rendering context
        if (ctxcyan60) {
            const gradientcyan60 = ctxcyan60.createLinearGradient(0, 0, 0, 60);
            gradientcyan60.addColorStop(0, "rgba(56, 186, 247, 0.85)");
            gradientcyan60.addColorStop(0.95, "rgba(56, 186, 247, 0.0)");
            this.mycyan60Chart = new Chart(areachartcyan60, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientcyan60,
                            borderColor: "#38baf7",
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
        if (this.mycyan60Chart) {
            this.mycyan60Chart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.mycyan60Chart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
