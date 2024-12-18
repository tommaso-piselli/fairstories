function savePNG() {
    const svg = document.querySelector("svg");
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = 300 / 96;
    canvas.width = svg.width.baseVal.value * scale;
    canvas.height = svg.height.baseVal.value * scale;
    const image = new Image();
    image.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(source)));
    image.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "visualization.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
  }

function saveSVG() {
    const svg = document.querySelector("svg");
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "visualization.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }