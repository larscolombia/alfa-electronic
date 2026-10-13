import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-area-yellow-chartjs-100",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="app-area-yellow-chartjs-100"></canvas>`,
})
export class AreaYellowChartjs100Component implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myyellow1hart!: Chart;

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
        const areachartyellow100 = document.getElementById("app-area-yellow-chartjs-100") as HTMLCanvasElement;
        const ctxyellow100 = areachartyellow100.getContext("2d"); // Get the 2D rendering context
        if (ctxyellow100) {
            const gradientyellow100 = ctxyellow100.createLinearGradient(0, 0, 0, 100);
            gradientyellow100.addColorStop(0, "rgba(241, 157, 0, 0.85)");
            gradientyellow100.addColorStop(0.95, "rgba(241, 157, 0, 0.0)");
            this.myyellow1hart = new Chart(areachartyellow100, {
                type: "line",
                data: {
                    labels: ["10:30", "11:00", "11:30", "12:00", "12:30", "01:00", "01:30"],
                    datasets: [
                        {
                            label: "# of Votes",
                            data: this.generateRandomData(),
                            radius: 0,
                            backgroundColor: gradientyellow100,
                            borderColor: "#fcab16",
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
        if (this.myyellow1hart) {
            this.myyellow1hart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myyellow1hart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
