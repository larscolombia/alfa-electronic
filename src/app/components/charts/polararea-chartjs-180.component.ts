import { Component } from "@angular/core";
import { Location } from "@angular/common";
import { Chart, registerables } from "chart.js/auto";
Chart.register(...registerables);

@Component({
    selector: "app-polararea-chartjs-180",
    standalone: true,
    imports: [],
    providers: [],
    template: `<canvas id="polararea-chartjs-180"></canvas>`,
})
export class PolarAreaChartjs180Component {
    mypolarArea180Chart!: Chart;

    ngAfterViewInit() {
        this.polarArea180chart();
    }

    /* chart  */
    polarArea180chart() {
        const areachartpolarArea180 = document.getElementById("polararea-chartjs-180") as HTMLCanvasElement;
        const ctxpolarArea180 = areachartpolarArea180.getContext("2d"); // Get the 2D rendering context
        if (ctxpolarArea180) {
            this.mypolarArea180Chart = new Chart(areachartpolarArea180, {
                type: "polarArea",
                data: {
                    labels: ["Comida", "Transporte", "Ninos", "Hogar", "Otros"],
                    datasets: [
                        {
                            label: "Categorias de gastos",
                            data: [40, 10, 15, 25, 10],
                            backgroundColor: ["rgb(241, 157, 0, 0.60)", "rgb(8, 160, 70, 0.55)", "rgb(200, 0, 54, 0.60)", "rgb(0, 73, 232, 0.55)", "rgb(0, 73, 232, 0.40)"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
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
