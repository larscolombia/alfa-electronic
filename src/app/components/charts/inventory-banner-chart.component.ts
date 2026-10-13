import { Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-inventory-banner-chart",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="inventory-banner-chart"></canvas>`,
})
export class InventoryBannerChartComponent implements OnDestroy {
    private intervalId: ReturnType<typeof setInterval> | undefined;
    myinventoryBannerChartChart!: Chart;

    ngAfterViewInit() {
        this.inventoryBannerChartchart();

        this.intervalId = setInterval(() => {
            this.randomizeChart();
        }, 3000);
    }

    /* chart  */
    randomScalingFactor() {
        return Math.round(Math.random() * 20);
    }
    generateRandomData() {
        return [this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor(), this.randomScalingFactor()];
    }
    inventoryBannerChartchart() {
        const areachartinventoryBannerChart = document.getElementById("inventory-banner-chart") as HTMLCanvasElement;
        const ctxinventoryBannerChart = areachartinventoryBannerChart.getContext("2d"); // Get the 2D rendering context
        if (ctxinventoryBannerChart) {
            var gradientgreen1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 195);
            gradientgreen1.addColorStop(0, "rgba(8, 160, 70, 1)");
            gradientgreen1.addColorStop(1, "rgba(8, 160, 70, 0.1)");
            var gradientred1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 190);
            gradientred1.addColorStop(0, "rgba(200, 0, 54, 1)");
            gradientred1.addColorStop(1, "rgba(200, 0, 54, 0.3)");
            var gradientyellow1 = ctxinventoryBannerChart.createLinearGradient(0, 0, 0, 195);
            gradientyellow1.addColorStop(0, "rgba(241, 157, 0, 1)");
            gradientyellow1.addColorStop(1, "rgba(241, 157, 0, 0.1)");

            this.myinventoryBannerChartChart = new Chart(areachartinventoryBannerChart, {
                type: "bar",
                data: {
                    labels: ["Ene-15", "Ene-30", "Feb-15", "Feb-30", "Mar-15", "Mar-30", "Abr-15", "Abr-30", "May-15", "May-30", "Jun-15", "Jun-30", "Jul-15", "Jul-30", "Ago-15", "Ago-30"],
                    datasets: [
                        {
                            label: "# de votos",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientyellow1,
                            borderColor: "rgba(241, 157, 0, 1)",
                            borderWidth: 1,
                            borderRadius: 15,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "# de votos",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientred1,
                            borderColor: "rgba(200, 0, 54, 0.65)",
                            borderWidth: 1,
                            borderRadius: 15,
                            fill: true,
                            tension: 0.0,
                        } as any,
                        {
                            label: "# de votos",
                            data: this.generateRandomData(),
                            radius: 2,
                            pointBackgroundColor: "#ffffff",
                            backgroundColor: gradientgreen1,
                            borderColor: "rgba(8, 160, 70, 1)",
                            borderWidth: 1,
                            borderRadius: 15,
                            fill: true,
                            tension: 0.0,
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
        if (this.myinventoryBannerChartChart) {
            this.myinventoryBannerChartChart.data.datasets.forEach((dataset) => {
                dataset.data = this.generateRandomData();
            });
            this.myinventoryBannerChartChart.update();
        }
    }
    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

}
