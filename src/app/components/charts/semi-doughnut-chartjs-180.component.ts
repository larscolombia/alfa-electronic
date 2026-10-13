import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-semi-doughnut-chartjs-180",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="semi-doughnut-chartjs-180" class="width-200 height-200 d-inline-flex justify-content-center align-items-center mt--25 position-relative"></canvas>`,
})
export class SemiDoughnutChartjs180Component {
    mysemidoughnut180Chart!: Chart;

    ngAfterViewInit() {
        this.semidoughnut180chart();
    }

    /* chart  */
    semidoughnut180chart() {
        const areachartsemidoughnut180 = document.getElementById("semi-doughnut-chartjs-180") as HTMLCanvasElement;
        const ctxsemidoughnut180 = areachartsemidoughnut180.getContext("2d"); // Get the 2D rendering context
        if (ctxsemidoughnut180) {
            this.mysemidoughnut180Chart = new Chart(areachartsemidoughnut180, {
                type: "doughnut",
                data: {
                    labels: ["Comida", "Transporte", "Ninos", "Hogar", "Otros"],
                    datasets: [
                        {
                            label: "Categorias de gastos",
                            data: [40, 10, 15, 25, 10],
                            backgroundColor: ["#fcab16", "#08a046", "#c80036", "#0249e8", "#becede"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    circumference: 180,
                    rotation: -90,
                    responsive: true,
                    cutout: 80,
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
