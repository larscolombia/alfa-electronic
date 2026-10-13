import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-doughnut-chartjs-100-2",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="doughnut-chartjs-100-2"></canvas>`,
})
export class DoughnutChartjs1002Component {
    mydoughnut1002Chart!: Chart;

    ngAfterViewInit() {
        this.doughnut1002chart();
    }

    /* chart  */
    doughnut1002chart() {
        const areachartdoughnut1002 = document.getElementById("doughnut-chartjs-100-2") as HTMLCanvasElement;
        const ctxdoughnut1002 = areachartdoughnut1002.getContext("2d"); // Get the 2D rendering context
        if (ctxdoughnut1002) {
            this.mydoughnut1002Chart = new Chart(areachartdoughnut1002, {
                type: "doughnut",
                data: {
                    labels: ["Food", "Transport", "Children", "Home", "Other"],
                    datasets: [
                        {
                            label: "Expense categories",
                            data: [40, 10, 15, 25, 10],
                            backgroundColor: ["#fcab16", "#08a046", "#c80036", "#0249e8", "#becede"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    cutout: 40,
                    plugins: {
                        legend: {
                            display: false,
                            position: "top",
                        },
                        title: {
                            display: false,
                            text: "",
                        },
                    },
                },
            });
        }
    }
}
