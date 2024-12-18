async function render() {
  let subject = "JurassicPark";
  let text = await d3.text(`../data/txt/${subject}.master`);
  let character_list = text.split("\n\n")[0];
  let timesteps = text.split("\n\n")[1];
  let solution = await d3.text(`../results/${subject}_fair_replaced.sol`);
  //let solution = await d3.text(`../results/${subject}_replaced.sol`);
  let graph = {
    nodes: [],
    edges: [],
  };

  // Read and parse the groups file
  let groupsText = await d3.text(`../data/groups/${subject}_groups.txt`);
  let character_colors = {};

  // Parse the groups file and create color mapping
  groupsText.split("\n").forEach((line) => {
    if (line.trim() === "") return;
    let [_, char, color] = line.split(":").map((s) => s.trim());
    character_colors[char] = color === "blue" ? "#4e79a7" : "#e15759"; // blue for blue group, red for red group
  });

  let max_timesteps = timesteps.split("\n").length - 1;
  console.log("max_timesteps:", max_timesteps);
  console.log("actual timesteps:", timesteps.split("\n").length);

  for (let i = 0; i < timesteps.split("\n").length - 1; i++) {
    let elems = timesteps
      .split("\n")
      [i].split(":")[1]
      .split(";")
      .map((e) => e.split(","))
      .flat();

    for (let el of elems) {
      el = el.trim();
      graph.nodes.push({ name: el, timestep: i, id: graph.nodes.length });

      if (character_colors[el] === undefined) {
        character_colors[el] = "#bab0ab";
      }
    }
  }

  for (let i = 0; i < timesteps.split("\n").length; i++) {
    let j = i + 1;
    let nodes_at_t1 = graph.nodes.filter((n) => n.timestep == i);
    let nodes_at_t2 = graph.nodes.filter((n) => n.timestep == j);

    let all_character_names = [
      ...new Set(nodes_at_t1.concat(nodes_at_t2).map((n) => n.name)),
    ];
    for (let char of all_character_names) {
      let char_in_t1 = nodes_at_t1.find((n) => n.name == char);
      let char_in_t2 = nodes_at_t2.find((n) => n.name == char);
      if (char_in_t1 == undefined || char_in_t2 == undefined) continue;
      graph.edges.push({
        id: graph.edges.length,
        source: char_in_t1,
        target: char_in_t2,
      });
    }
  }

  let solution_lines = solution.split("\n").filter((l) => l[0] == "x");

  // DRAWING
  let width = window.innerWidth;
  let height = window.innerHeight;
  let svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  let padding = { left: 20, right: 20, top: 20, bottom: 20 };

  let space_between_timesteps =
    (width - padding.left - padding.right) / max_timesteps;

  // NODES
  for (let i = 0; i < max_timesteps; i++) {
    let timestep_line = timesteps.split("\n")[i];
    if (!timestep_line) {
      console.log(`No timestep data for step ${i}`);
      continue;
    }

    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);
    let interactions_at_this_timestep = timesteps.split("\n")[i].split(":")[1];

    console.log(nodes_at_this_timestep.map((n) => n.name));
    nodes_at_this_timestep = nodes_at_this_timestep.sort((a, b) => {
      let relevant_lines = solution_lines.filter(
        (l) =>
          l.includes(a.name) && l.includes("_" + i + "_") && l.includes(b.name)
      );

      if (
        relevant_lines[0] == "x_" + i + "_" + a.name + "_" + b.name + " 0" ||
        relevant_lines[0] == "x_" + i + "_" + b.name + "_" + a.name + " 1"
      ) {
        return 1;
      } else if (
        relevant_lines[0] == "x_" + i + "_" + a.name + "_" + b.name + " 1" ||
        relevant_lines[0] == "x_" + i + "_" + b.name + "_" + a.name + " 0"
      ) {
        return -1;
      } else return 0;
    });
    console.log("===");

    let interaction_groups = interactions_at_this_timestep
      .split(";")
      .map((group) => group.split(",").map((char) => char.trim()));

    function findInteractionGroup(nodeName) {
      return interaction_groups.find((group) => group.includes(nodeName));
    }

    let baseY = padding.top;
    for (let j = 0; j < nodes_at_this_timestep.length; j++) {
      let curr_node = nodes_at_this_timestep[j];
      console.log(curr_node);

      if (j == 0) {
        curr_node.y = baseY;
      } else {
        let prev_node = nodes_at_this_timestep[j - 1];
        let curr_group = findInteractionGroup(curr_node.name);
        let prev_group = findInteractionGroup(prev_node.name);

        if (curr_group == prev_group) {
          curr_node.y = prev_node.y + 30;
        } else {
          curr_node.y = prev_node.y + 60;
        }
      }
    }
  }

  // EDGES
  for (let i = 0; i < max_timesteps; i++) {
    let edges_at_this_timestep = graph.edges.filter(
      (e) => e.source.timestep == i
    );

    for (let k in edges_at_this_timestep) {
      svg
        .append("line")
        .attr("class", "edge")
        .attr("x1", i * space_between_timesteps + 2 * padding.left)
        .attr("x2", (i + 1) * space_between_timesteps + 2 * padding.left)
        .attr("y1", edges_at_this_timestep[k].source.y)
        .attr("y2", edges_at_this_timestep[k].target.y)
        .attr("stroke", character_colors[edges_at_this_timestep[k].source.name])
        .attr("stroke-width", 5);
    }
  }

  for (let i = 0; i < max_timesteps; i++) {
    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);

    for (let j in nodes_at_this_timestep) {
      svg
        .append("circle")
        .attr("r", 5)
        .attr("cx", i * space_between_timesteps + 2 * padding.left)
        .attr("cy", nodes_at_this_timestep[j].y)
        .attr("fill", character_colors[nodes_at_this_timestep[j].name])
        .on("mouseover", () =>
          console.log(character_colors[nodes_at_this_timestep[j].name])
        );

      // svg
      //   .append("text")
      //   .attr("x", i * space_between_timesteps + 2 * padding.left - 7.5)
      //   .attr("y", nodes_at_this_timestep[j].y + 3)
      //   .style("font-family", "arial")
      //   .style("font-size", "10px")
      //   .style("font-weight", "bold")
      //   .style("stroke", "black")
      //   .style("stroke-width", "0.6px")
      //   .style("fill", "white")
      //   .text(nodes_at_this_timestep[j].name);
    }
  }

  // Add save buttons after creating the SVG
  const buttonContainer = d3
    .select("body")
    .append("div")
    .style("position", "fixed")
    .style("bottom", "20px")
    .style("right", "20px");

  buttonContainer.append("button").text("Save as SVG").on("click", saveSVG);

  buttonContainer
    .append("button")
    .text("Save as PNG")
    .style("margin-left", "10px")
    .on("click", savePNG);
}

// Save functions remain unchanged
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

render();
