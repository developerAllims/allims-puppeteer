const express = require('express')
const app = express()

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const defaultPdfOptions = {
    format: 'A4',
    landscape: false,
    height: '297mm',
    width: '210mm',
    margin: {
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
        top: '0mm'
    },
    path: '',
    printBackground: false,
    scale: 1,
}

const puppeteer = require('puppeteer')

const makePdf = async (html = '', json = {}, sleep = 2000, base64 = false, pdfOptions) => {
    let newPdfOptions = pdfOptions || defaultPdfOptions
    let newHtml = html
    let newJson = json
    let browser = null
    let logs = []
    let file = null
    try {
        browser = await puppeteer.launch({
            defaultViewport: {
                deviceScaleFactor: 1,
                hasTouch: false,
                height: 1080,
                isLandscape: true,
                isMobile: false,
                width: 1920,
            },
            headless: true,
            ignoreHTTPSErrors: true,
        })
        const page = await browser.newPage()
        page.on("console", (msg) => {
            const newMsg = msg.text()
            const parseBlock = newMsg.indexOf('parser-blocking')

            if (parseBlock < 0) {
                const JSHandle = newMsg.indexOf('JSHandle@')
                if (JSHandle < 0) {
                    logs.push(msg.text())
                }
            }
        })
        if (typeof newJson === 'string') newJson = JSON.parse(newJson)
        if (newJson) newHtml = `<script> var allims = ${JSON.stringify(newJson)} </script> ${newHtml}`
        await page.setContent(newHtml)
        await page.waitForTimeout(sleep)
        file = await page.pdf(newPdfOptions)
        if (base64) {
            file = file.toString('base64')
            file = {
                headers: {
                    "Content-type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Length": file.length,
                },
                statusCode: 200,
                body: file,
                logs,
            }
        }
    } catch(error) {
        throw error
    } finally {
        if (browser) await browser.close()
    }
    return file
}

app.get('/', async (req, res) => {
    try {
        const pdf = await makePdf(html)
        const filename = 'allims.pdf'
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Length', pdf.length)
        res.status(200).send(pdf)
    } catch(error) {
        res.send({ success: false, message: error.message })
    }
})

app.post('/', async (req = {}, res) => {
    try {
        const { body: { filename, html, json, sleep, pdfOptions, base64 } } = req
        const pdf = await makePdf(html, json, sleep, base64, pdfOptions)
        if (!base64) {
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Content-Length', pdf.length)
        }
        res.status(200).send(pdf)
    } catch(error) {
        res.send({ success: false, message: error.message })
    }
})

const PORT = 3000
app.listen(PORT, () => console.log(`App is running: http://localhost:${PORT}`))

const html = `
<html>
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <link
        rel="stylesheet"
        type="text/css"
        href="https://cdn3.devexpress.com/jslib/20.1.6/css/dx.common.css"
        />
        <link
        rel="stylesheet"
        type="text/css"
        href="https://cdn3.devexpress.com/jslib/20.1.6/css/dx.light.css"
        />
        <script src="https://cdn3.devexpress.com/jslib/20.1.6/js/dx.all.js"></script>
        <style>
        body {
            font-size: 12px;
            line-height: 5px;
            max-width: 800px;
            margin: auto;
            padding: 10px;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            color: #555;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header img {
            height: 110px;
            width: 150px;
        }

        .header-margin {
            margin-top: 30px;
        }

        .title {
            text-align: center;
        }

        .title-summary {
            margin-left: 130px;
        }

        .composition {
            display: block;
            justify-content: center;
            align-items: center;
            margin-top: 30px;
        }

        .compositions {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .composition-ingredients {
            display: inline-block;
            border-style: solid;
            border-radius: 10px;
            border-width: 1px;
            padding: 5px;
            width: 300px;
            height: 170px;
        }

        .composition-ingredients table {
            width: 100%;
            text-align: left;
            padding: 10px;
            text-align: center;
        }

        .composition-ingredients table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
            font-weight: bold;
        }

        .composition-ingredients table tr.item td {
            border-bottom: 1px solid #eee;
            font-weight: normal;
            font-size: 12px;
            line-height: 15px;
        }

        .composition-products {
            display: inline-block;
            margin-left: 20px;
            border-style: solid;
            border-radius: 10px;
            border-width: 1px;
            padding: 5px;
            width: 500px;
            height: 170px;
        }

        .composition-products table {
            width: 100%;
            text-align: left;
            padding: 10px;
            text-align: center;
        }

        .composition-products table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
            font-weight: bold;
        }

        .composition-products table tr.item td {
            border-bottom: 1px solid #eee;
            font-weight: normal;
            font-size: 12px;
            line-height: 15px;
        }

        .summary {
            width: 400px;
        }

        .summary-table {
            border-style: solid;
            border-radius: 10px;
            border-width: 1px;
            padding: 5px;
            width: 100%;
        }

        .summary-table table {
            width: 100%;
            text-align: left;
            padding: 10px;
            text-align: center;
        }

        .summary-table table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
            font-weight: bold;
        }

        .summary-table table tr.item td {
            border-bottom: 1px solid #eee;
            font-weight: normal;
            font-size: 12px;
            line-height: 15px;
        }

        .description {
            line-height: 15px;
        }

        .summary-eval {
            display: flex;
            margin-top: 30px;
        }

        .footer {
        }

        .hr {
            border-top: 1px solid #094cfa;
        }

        .triangleNeedle {
            height: 120px;
            width: 100%;
        }

        .eval-nutri {
            display: flex;
            width: 400px;
        }
        </style>
    </head>
    <body>
        <div class="header">
        <div>
            <div>
            <h4>ALLIMS</h4>
            <p>Address: 26 Atibaia Street Campinas, SP 13.092-142 Brazil</p>
            </div>
            <div class="header-margin">
            <h4>Gustavo Person</h4>
            <p>Email: allims@allims.com.br</p>
            <p>Phone: +55 (19) 3213-2301</p>
            </div>
        </div>
        <img src="https://publique.com/wp-content/uploads/2016/10/DSM.jpg" />
        </div>
        <div class="composition">
        <div class="title"><h3>COMPOSITION</h3></div>
        <div class="compositions">
            <div class="composition-ingredients">
            <table cellpadding="3" cellspacing="0">
                <thead>
                <tr class="heading">
                    <th>INGREDIENT</th>
                    <th>%</th>
                </tr>
                </thead>
                <tbody>
                <tr class="item">
                    <td>Corn 7,8% CP</td>
                    <td>50</td>
                </tr>
                <tr class="item">
                    <td>Full Fat Soy Extruded</td>
                    <td>6</td>
                </tr>
                <tr class="item">
                    <td>Soy Bean Meal 45% CP</td>
                    <td>25</td>
                </tr>
                <tr class="item">
                    <td>Sunflower Meal</td>
                    <td>5</td>
                </tr>
                <tr class="item">
                    <td>Wheat</td>
                    <td>10</td>
                </tr>
                </tbody>
            </table>
            </div>
            <div class="composition-products">
            <table cellpadding="3" cellspacing="0">
                <thead>
                <tr class="heading">
                    <th>PRODUCT</th>
                    <th>QTY</th>
                    <th>PRICE (%)</th>
                    <th>COST ($/t)</th>
                </tr>
                </thead>
                <tbody>
                <tr class="item">
                    <td>HiPhos 20.000 GT</td>
                    <td>75</td>
                    <td>8</td>
                    <td>0.6</td>
                </tr>
                <tr class="item">
                    <td>ProAct CT</td>
                    <td>200</td>
                    <td>14</td>
                    <td>2.8</td>
                </tr>
                <tr class="item">
                    <td>WX CT 2.000</td>
                    <td>75</td>
                    <td>8.1</td>
                    <td>0.61</td>
                </tr>
                </tbody>
            </table>
            </div>
        </div>
        </div>
        <div class="summary-eval">
        <div class="summary">
            <div class="title-summary"><h3>SUMMARY</h3></div>
            <div class="summary-table">
            <table cellpadding="3" cellspacing="0">
                <thead>
                <tr class="heading">
                    <th>Nutricional Level</th>
                    <th>Total corrected additivity</th>
                    <th>Matrix value</th>
                </tr>
                </thead>
                <tbody>
                <tr class="item">
                    <td>CP (%)</td>
                    <td>1.206</td>
                    <td>3445.714</td>
                </tr>
                <tr class="item">
                    <td>Lys (%)</td>
                    <td>0.053</td>
                    <td>151.429</td>
                </tr>
                <tr class="item">
                    <td>Met (%)</td>
                    <td>0.010</td>
                    <td>28.571</td>
                </tr>
                <tr class="item">
                    <td>M+C (%)</td>
                    <td>0.046</td>
                    <td>131.429</td>
                </tr>
                <tr class="item">
                    <td>Thr (%)</td>
                    <td>0.062</td>
                    <td>177.143</td>
                </tr>
                <tr class="item">
                    <td>Trp (%)</td>
                    <td>0.007</td>
                    <td>20.000</td>
                </tr>
                <tr class="item">
                    <td>Arg (%)</td>
                    <td>0.054</td>
                    <td>154.286</td>
                </tr>
                <tr class="item">
                    <td>Val (%)</td>
                    <td>0.070</td>
                    <td>200.000</td>
                </tr>
                <tr class="item">
                    <td>Leu (%)</td>
                    <td>0.066</td>
                    <td>188.571</td>
                </tr>
                <tr class="item">
                    <td>Ile (%)</td>
                    <td>0.047</td>
                    <td>134.286</td>
                </tr>
                <tr class="item">
                    <td>His (%)</td>
                    <td>0.020</td>
                    <td>57.143</td>
                </tr>
                <tr class="item">
                    <td>P Avl (%)</td>
                    <td>0.173</td>
                    <td>494.286</td>
                </tr>
                <tr class="item">
                    <td>P Digt (%)</td>
                    <td>0.156</td>
                    <td>445.714</td>
                </tr>
                <tr class="item">
                    <td>Ca (%)</td>
                    <td>0.195</td>
                    <td>557.143</td>
                </tr>
                <tr class="item">
                    <td>Na (%)</td>
                    <td>0.020</td>
                    <td>57.143</td>
                </tr>
                <tr class="item">
                    <td>ME (MJ/kg)</td>
                    <td>0.43</td>
                    <td>1240.00</td>
                </tr>
                <tr class="item">
                    <td>ME (kcal/kg)</td>
                    <td>103</td>
                    <td>295700</td>
                </tr>
                </tbody>
            </table>
            </div>
        </div>
        <div class="evaluation">
            <div class="eval-nutri">
            <div class="triangleNeedle" id="triangleNeedleN1"></div>
            <div class="triangleNeedle" id="triangleNeedleN2"></div>
            </div>
            <div class="eval-nutri">
            <div class="triangleNeedle" id="triangleNeedleA1"></div>
            <div class="triangleNeedle" id="triangleNeedleA2"></div>
            </div>
            <div class="eval-nutri">
            <div class="triangleNeedle" id="triangleNeedleA3"></div>
            <div class="triangleNeedle" id="triangleNeedleA4"></div>
            </div>
            <div class="eval-nutri">
            <div class="triangleNeedle" id="triangleNeedleA5"></div>
            <div class="triangleNeedle" id="triangleNeedleA6"></div>
            </div>
        </div>
        </div>
        <div class="description"><p class="">teste 123 do lucas</p></div>
        <div class="footer">
        <h4>Rafael Fernando Sens</h4>
        <p>Regional Technical Services Manager</p>
        <p>ANH Latin America</p>
        </div>
        <hr class="hr" />
        <script>
        var allimsData = allims;
        var dataNutrient = allimsData.evaluation[0].levels;
        var dataAntiNutrient = allimsData.evaluation[1].levels;

        function getOptions(lev) {
            return {
            geometry: {
                startAngle: lev.startAngle,
                endAngle: lev.endAngle,
            },
            scale: {
                startValue: lev.startValue,
                endValue: lev.endValue,
                tickInterval: lev.tickInterval,
            },
            value: lev.firstIndicator.value,
            valueIndicator: {
                type: "triangleNeedle",
                color: lev.firstIndicator.color,
            },
            subvalues: [lev.secondIndicator.value],
            subvalueIndicator: {
                type: "triangleNeedle",
                color: lev.secondIndicator.color,
            },
            title: {
                text: lev.title,
                font: { size: 12 },
            },
            rangeContainer: {
                ranges: lev.range,
            },
            };
        }

        var i = 1;
        for (d of dataNutrient) {
            $("#triangleNeedleN" + i).dxCircularGauge(
            $.extend(true, {}, getOptions(d))
            );
            i++;
        }

        i = 1;
        for (d of dataAntiNutrient) {
            $("#triangleNeedleA" + i).dxCircularGauge(
            $.extend(true, {}, getOptions(d))
            );
            i++;
        }
        </script>
    </body>
    </html>
`