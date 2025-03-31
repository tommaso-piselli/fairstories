let characters_selected = [];

async function render() {
  // let subject = "JurassicPark";
  let subject = visualization_options.subject;
  let coloring = visualization_options.coloring;
  let text = await d3.text(`../data/txt/${subject}.master`);
  
  let title = document.createElement("h1")
  title.innerHTML = `<h1>${subject}</h1> <h3>${coloring}</h3>`;
  document.body.appendChild(title);

  for (let experiment of visualization_options.experiments){
    let title = document.createElement("div");
    title.innerHTML = `<h2>${experiment}</h2>`;
    document.body.appendChild(title);

    let solution = await d3.text(
      `../results/${subject}/${coloring}/sol/${experiment}/${subject}_${experiment}_replaced.sol`
    );
  
    // Read and parse the groups file
    let groupsText = await d3.text(
      `../results/${subject}/${coloring}/_${coloring}.txt`
    );

    let statspath = `../results/${subject}/${coloring}/log/${subject}_${experiment}_out.txt`;
    
    try {
      let stats = await d3.text(statspath)
      stats = stats.split("=====================================")[1]

      stats = stats.split("---")

      if (experiment.toLowerCase().includes("skewcrosswiggles")) stats = stats;
      else if (experiment.toLowerCase().includes("wiggles")) stats = [stats[0], stats[1], stats[2], stats[5], stats[6]]
      else if (experiment.toLowerCase().includes("skew")) stats = [stats[0], stats[1], stats[2], stats[3], stats[4]]
      else stats = [stats[0], stats[1], stats[2]]
      
      // stats = stats.join("\n---")

      for (let elem of stats){
        let elemDiv = document.createElement("div");
        elemDiv.style.display = "inline-block";
        elemDiv.style.width = "calc(100% / " + stats.length + ")";
        elemDiv.style.boxSizing = "border-box";
        elemDiv.style.fontFamily = "monospace";
        elemDiv.style.padding = "10px";
        elemDiv.style.textAlign = "left";
        elemDiv.innerHTML = elem.split("\n").join("<br>");
        document.body.appendChild(elemDiv);
      }

    } catch (error) { console.log(error) }

    let svg = draw(text, solution, groupsText, experiment);
  }
}

function draw(text, solution, groupsText, experiment) {
  let graph = {
    nodes: [],
    edges: [],
  };

  let timesteps = text.split("\n\n")[1];
  let character_colors = {};

  // Parse the groups file and create color mapping
  groupsText.split("\n").forEach((line) => {
    if (line.trim() === "") return;
    let [_, char, color] = line.split(":").map((s) => s.trim());
    character_colors[char] = color === "blue" ? "#4e79a7" : "#e15759"; // blue for blue group, red for red group
  });

  let max_timesteps = timesteps.split("\n").length - 1;

  // Build nodes for every timestep
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

  // Build edges connecting nodes from one timestep to the next
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

  let solution_lines = solution.split("\n").filter((l) => l[0] == "x" || l[0] == "b");

  // DRAWING
  let svg = d3
    .select("body")
    .append("svg")
    .attr("width", visualization_options.width)
    .attr("height", visualization_options.height);

  let space_between_timesteps =
    (visualization_options.width -
      visualization_options.padding.left -
      visualization_options.padding.right) /
    max_timesteps;

  // GET COORDINATES FOR NODES
  assign_node_coordinates(
    timesteps,
    max_timesteps,
    solution_lines,
    graph,
    visualization_options,
    space_between_timesteps,
    experiment
  );

  // DRAW GROUPS
  for (let t = 0; t < max_timesteps; t++) {
    let interactions_at_this_timestep = timesteps.split("\n")[t].split(":")[1];
    let interaction_groups = interactions_at_this_timestep
      .split(";")
      .map((group) => group.split(",").map((char) => char.trim()));

    for (let group of interaction_groups) {
      let nodes_in_group = graph.nodes.filter(
        (n) => n.timestep == t && group.includes(n.name)
      );
      if (nodes_in_group.length == 1) continue;
      let y_values = nodes_in_group.map((n) => n.y);
      let min_y = Math.min(...y_values);
      let max_y = Math.max(...y_values);

      svg
        .append("rect")
        .attr("id", "t" + t + "-" + experiment + "-group-" + group.join("-"))
        .attr(
          "x",
          t * space_between_timesteps +
            visualization_options.padding.left -
            space_between_timesteps * 0.125
        )
        .attr(
          "y",
          min_y - visualization_options.base_node_vertical_distance * 0.4
        )
        .attr("width", space_between_timesteps * 0.25)
        .attr(
          "height",
          max_y -
            min_y +
            visualization_options.base_node_vertical_distance * 0.8
        )
        .attr("fill", "orange")
        .attr("fill-opacity", 0.3)
        .attr("rx", 10)
        .attr("ry", 10);
    }
  }

  // EDGES (curved lines for character storylines)
  let char_line_coords = {};

  for (let char of Object.keys(character_colors)) {
    char_line_coords[char] = [];
    for (let i = 0; i < max_timesteps; i++) {
      let char_in_t1 = graph.nodes.find(
        (n) => n.name == char && n.timestep == i
      );
      if (char_in_t1 == undefined) continue;
      else {
        char_line_coords[char].push({
          x: char_in_t1.x - space_between_timesteps * 0.1,
          y: char_in_t1.y,
        });
        char_line_coords[char].push({ x: char_in_t1.x, y: char_in_t1.y });
        char_line_coords[char].push({
          x: char_in_t1.x + space_between_timesteps * 0.1,
          y: char_in_t1.y,
        });
      }
    }
  }

  for (let char of Object.keys(character_colors)) {
    let line_coords = char_line_coords[char];
    if (line_coords.length <= 3) continue;
    // create a path from the line_coords
    let line = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCatmullRom.alpha(0.8));

    svg
      .append("path")
      .datum(line_coords)
      .attr("fill", "none")
      .attr("class", "char-line char-line-" + char)
      .attr("id", experiment + "-char-line-" + char)
      .attr("stroke", character_colors[char])
      .attr("stroke-width", visualization_options.line_stroke_size)
      .style("stroke-linecap", "round")
      .attr("d", line)
      .attr("opacity", () => {
        if (["RM", "DS", "DN"].includes(char)) return 1;
        else return 1;
      })
      .on("mouseover", () => {
        if (characters_selected.includes(char)) return;
        else d3.selectAll(".char-line").attr("stroke-width", visualization_options.line_stroke_size);
        d3.selectAll(".char-line-" + char).attr("stroke-width", visualization_options.line_stroke_size * 1.5);
      })
      .on("mouseout", () => {
        if (characters_selected.includes(char)) return;
        else d3.selectAll(".char-line").attr("stroke-width", visualization_options.line_stroke_size);
      })
      .on("click", () => {
        if (characters_selected.includes(char)) {
          characters_selected = characters_selected.filter((c) => c !== char);
          d3.selectAll(".char-line-" + char).attr("stroke-width", visualization_options.line_stroke_size);
        } else {
          characters_selected.push(char);
          d3.selectAll(".char-line-" + char).attr("stroke-width", visualization_options.line_stroke_size * 1.5);
      }})
  }

  // DRAW THE NODES
  for (let i = 0; i < max_timesteps; i++) {
    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);

    for (let j in nodes_at_this_timestep) {
      svg
        .append("circle")
        .attr("r", visualization_options.node_radius)
        .attr("id", "t" + i + "-" + experiment + "-node-" + nodes_at_this_timestep[j].name)
        .attr("cx", nodes_at_this_timestep[j].x)
        .attr("cy", nodes_at_this_timestep[j].y)
        .attr("fill", character_colors[nodes_at_this_timestep[j].name])
        .on("mouseover", () => {
          console.log(i);
          console.log(character_colors[nodes_at_this_timestep[j].name]);
          console.log(nodes_at_this_timestep[j].name);
          console.log(nodes_at_this_timestep[j].y);
        });
    }
  }

  for (let char of Object.keys(character_colors)) {
    let line_coords = char_line_coords[char];
    if (line_coords.length <= 3) continue;
    // append a circle and label every few steps
    for (let i = 1; i < line_coords.length - 12; i += 12) {
      if (line_coords[i].y != line_coords[i + 3].y) continue;
      svg
        .append("circle")
        .attr("r", visualization_options.line_label_circle_size)
        .attr("cx", line_coords[i].x + space_between_timesteps * 0.5)
        .attr("id", "t" + i + "-" + experiment + "-charname-" + char)
        .attr(
          "cy",
          line_coords[i].y + (line_coords[i + 3].y - line_coords[i].y) * 0.5
        )
        .attr("fill", "white");

      svg
        .append("text")
        .attr("id", "t" + i + "-" + experiment + "-charnamebackground-" + char)
        .attr("x", line_coords[i].x + space_between_timesteps * 0.5)
        .attr(
          "y",
          line_coords[i].y + (line_coords[i + 3].y - line_coords[i].y) * 0.5 + 3
        )
        .text(char)
        .style("font-family", "Arial")
        .attr("font-size", visualization_options.line_label_font_size)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("fill", character_colors[char]);
    }
  }

  return svg;
}

function assign_node_coordinates(
  timesteps,
  max_timesteps,
  solution_lines,
  graph,
  visualization_options,
  space_between_timesteps,
  experiment
) {

  // count the maximum number of nodes at every timestep
  let max_nodes_at_timestep = 0;
  for (let i=0; i<max_timesteps; i++){
    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);
    if (nodes_at_this_timestep.length > max_nodes_at_timestep) max_nodes_at_timestep = nodes_at_this_timestep.length;
  }

  for (let i = 0; i < max_timesteps; i++) {
    let timestep_line = timesteps.split("\n")[i];
    if (!timestep_line) {
      console.log(`No timestep data for step ${i}`);
      continue;
    }

    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);

    let min_b = Number.MAX_SAFE_INTEGER;
    for (let b_line of solution_lines.filter((l) => l.startsWith("b_"))) {
      let b_value = parseInt(b_line.split(" ")[1]);
      if (b_value < min_b) min_b = b_value;
    }

    let timestep_b = max_nodes_at_timestep + 2;
    if (visualization_options.read_b){
      let b_line = solution_lines.find((l) => l.includes("b_" + i + " "));
      if (b_line) timestep_b -= parseInt(b_line.split(" ")[1]) - min_b;
      timestep_b -= nodes_at_this_timestep.length;
    }
    if (!experiment.toLowerCase().includes("wiggles")) timestep_b = 0;

    let interactions_at_this_timestep = timesteps
      .split("\n")
      [i].split(":")[1]
      .trim();

    nodes_at_this_timestep = nodes_at_this_timestep.sort((a, b) => {
      let relevant_lines = solution_lines.filter(
        (l) =>
          // l.includes(a.name) && l.includes("_" + i + "_") && l.includes(b.name)
          l.includes("_" + i + "_" + a.name + "_" + b.name) ||
          l.includes("_" + i + "_" + b.name + "_" + a.name)
      );
      if (
        relevant_lines[0] === "x_" + i + "_" + a.name + "_" + b.name + " 0" ||
        relevant_lines[0] === "x_" + i + "_" + b.name + "_" + a.name + " 1"
      ) {
        return 1;
      } else if (
        relevant_lines[0] === "x_" + i + "_" + a.name + "_" + b.name + " 1" ||
        relevant_lines[0] === "x_" + i + "_" + b.name + "_" + a.name + " 0"
      ) {
        return -1;
      } else return 0;
    });

    let interaction_groups = interactions_at_this_timestep
      .split(";")
      .map((group) => group.split(",").map((char) => char.trim()));

    function findInteractionGroup(nodeName) {
      return interaction_groups.find((group) => group.includes(nodeName));
    }
    

    let baseY = visualization_options.padding.top + timestep_b * visualization_options.base_node_vertical_distance;
    for (let j = 0; j < nodes_at_this_timestep.length; j++) {
      let curr_node = nodes_at_this_timestep[j];
      curr_node.x =
        i * space_between_timesteps + visualization_options.padding.left;

      if (j === 0) {
        curr_node.y = baseY;
      } else {
        let prev_node = nodes_at_this_timestep[j - 1];
        let curr_group = findInteractionGroup(curr_node.name);
        let prev_group = findInteractionGroup(prev_node.name);

        if (curr_group === prev_group) {
          curr_node.y =
            prev_node.y + visualization_options.base_node_vertical_distance;
        } else {
          curr_node.y =
            prev_node.y + visualization_options.between_group_vertical_distance;
        }
      }
    }
  }

  if (visualization_options.reduce_wiggles && !experiment.toLowerCase().includes("wiggles"))
    iterate_for_better_bendiness(
      graph,
      timesteps,
      max_timesteps,
      visualization_options
    );
}

function morph(text, solution, groupsText, experiment, svg){
  console.log("morphing")

  let graph = {
    nodes: [],
    edges: [],
  };

  let timesteps = text.split("\n\n")[1];
  let character_colors = {};

  // Parse the groups file and create color mapping
  groupsText.split("\n").forEach((line) => {
    if (line.trim() === "") return;
    let [_, char, color] = line.split(":").map((s) => s.trim());
    character_colors[char] = color === "blue" ? "#4e79a7" : "#e15759"; // blue for blue group, red for red group
  });

  let max_timesteps = timesteps.split("\n").length - 1;


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

  // Build edges connecting nodes from one timestep to the next
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

  let solution_lines = solution.split("\n").filter((l) => l[0] == "x" || l[0] == "b");

  let space_between_timesteps =
    (visualization_options.width -
      visualization_options.padding.left -
      visualization_options.padding.right) /
    max_timesteps;

  // GET COORDINATES FOR NODES
  assign_node_coordinates(
    timesteps,
    max_timesteps,
    solution_lines,
    graph,
    visualization_options,
    space_between_timesteps,
    experiment
  );

  // MOVE GROUPS
  for (let t = 0; t < max_timesteps; t++) {
    let interactions_at_this_timestep = timesteps.split("\n")[t].split(":")[1];
    let interaction_groups = interactions_at_this_timestep
      .split(";")
      .map((group) => group.split(",").map((char) => char.trim()));

    for (let group of interaction_groups) {
      let nodes_in_group = graph.nodes.filter(
        (n) => n.timestep == t && group.includes(n.name)
      );
      if (nodes_in_group.length == 1) continue;
      let y_values = nodes_in_group.map((n) => n.y);
      let min_y = Math.min(...y_values);
      let max_y = Math.max(...y_values);

      svg.select("#" + "t" + t + "-" + experiment + "-group-" + group.join("-"))
        .transition()
        .duration(10000)
        .attr(
          "x",
          t * space_between_timesteps +
            visualization_options.padding.left -
            space_between_timesteps * 0.125
        )
        .attr(
          "y",
          min_y - visualization_options.base_node_vertical_distance * 0.4
        )
        .attr("width", space_between_timesteps * 0.25)
        .attr(
          "height",
          max_y -
            min_y +
            visualization_options.base_node_vertical_distance * 0.8
        )
        .attr("fill", "orange")
        .attr("fill-opacity", 0.3)
        .attr("rx", 10)
        .attr("ry", 10);
    }
  }

  // EDGES (curved lines for character storylines)
  let char_line_coords = {};

  for (let char of Object.keys(character_colors)) {
    char_line_coords[char] = [];
    for (let i = 0; i < max_timesteps; i++) {
      let char_in_t1 = graph.nodes.find(
        (n) => n.name == char && n.timestep == i
      );
      if (char_in_t1 == undefined) continue;
      else {
        char_line_coords[char].push({
          x: char_in_t1.x - space_between_timesteps * 0.1,
          y: char_in_t1.y,
        });
        char_line_coords[char].push({ x: char_in_t1.x, y: char_in_t1.y });
        char_line_coords[char].push({
          x: char_in_t1.x + space_between_timesteps * 0.1,
          y: char_in_t1.y,
        });
      }
    }
  }

  // move the paths
  for (let char of Object.keys(character_colors)) {
    let line_coords = char_line_coords[char];
    if (line_coords.length <= 3) continue;
    // create a path from the line_coords
    let line = d3
      .line()
      .x((d) => d.x)
      .y((d) => {
        return d.y
      })
      .curve(d3.curveCatmullRom.alpha(0.8));

    let selectline = "#" + experiment + "-char-line-" + char

    d3.select("#" + experiment + "-char-line-" + char)
      .transition()
      .duration(visualization_options.speed)
      .attr("d", line(line_coords))

    for (let i = 1; i < line_coords.length - 12; i += 12) {
      svg.select("#t" + i + "-" + experiment + "-charname-" + char)
        .transition()
        .duration(visualization_options.speed)
        .attr("cx", line_coords[i].x + space_between_timesteps * 0.5)
        .attr(
          "cy",
          line_coords[i].y + (line_coords[i + 3].y - line_coords[i].y) * 0.5
        )

      svg.select("#t" + i + "-" + experiment + "-charnamebackground-" + char)
        .transition()
        .duration(visualization_options.speed)
        .attr("x", line_coords[i].x + space_between_timesteps * 0.5 - 7)
        .attr(
          "y",
          line_coords[i].y + (line_coords[i + 3].y - line_coords[i].y) * 0.5 + 3
        )
    }
  }

    // MOVE THE NODES
    for (let i = 0; i < max_timesteps; i++) {
      let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);
  
      for (let j in nodes_at_this_timestep) {
        console.log("#" + "t" + i + "-" + experiment + "-node-" + nodes_at_this_timestep[j].name)
        console.log(svg.select("#" + "t" + i + "-" + experiment + "-node-" + nodes_at_this_timestep[j].name))
        d3.select("#" + "t" + i + "-" + experiment + "-node-" + nodes_at_this_timestep[j].name)
          .transition()
          .duration(visualization_options.speed)
          .attr("cx", nodes_at_this_timestep[j].x)
          .attr("cy", nodes_at_this_timestep[j].y)
      }
    }
}

// this function is to be finished still - do not trust
function iterate_for_better_bendiness(
  graph,
  timesteps,
  max_timesteps,
  visualization_options
) {
  let max_iterations = visualization_options.max_reduce_wiggles_iterations;
  let starting_bendiness = count_total_bendiness(graph);

  for (let i = 0; i < max_iterations; i++) {
    for (let j = 0; j < max_timesteps; j++) {
      let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == j);

      // sort nodes by y
      nodes_at_this_timestep = nodes_at_this_timestep.sort((a, b) => a.y - b.y);

      // save all the old coordinates
      for (let node of nodes_at_this_timestep) {
        node.old_y = node.y;
      }

      let interactions_at_this_timestep = timesteps
        .split("\n")
        [j].split(":")[1];
      let interaction_groups = interactions_at_this_timestep
        .split(";")
        .map((group) => group.split(",").map((char) => char.trim()));

      // sort interaction groups by y
      interaction_groups = interaction_groups.sort((a, b) => {
        let a_y = nodes_at_this_timestep.find((n) => a.includes(n.name)).y;
        let b_y = nodes_at_this_timestep.find((n) => b.includes(n.name)).y;
        return a_y - b_y;
      });

      let found = false;

      for (let g = 0; g < interaction_groups.length; g++) {
        let group = interaction_groups[interaction_groups.length - g - 1];
        let nodes_in_group = nodes_at_this_timestep.filter((n) =>
          group.includes(n.name)
        );
        let max_y = Math.max(...nodes_in_group.map((n) => n.y));
        let space_below = 0;

        if (g === 0) {
          space_below = visualization_options.height - max_y;
        } else {
          let next_group = interaction_groups[interaction_groups.length - g];
          let nodes_in_next_group = nodes_at_this_timestep.filter((n) =>
            next_group.includes(n.name)
          );
          let min_y_next = Math.min(...nodes_in_next_group.map((n) => n.y));
          space_below = min_y_next - max_y;
        }

        if (
          space_below <= visualization_options.between_group_vertical_distance
        ) {
          continue;
        } else {
          for (let node of nodes_in_group) {
            node.y += visualization_options.base_node_vertical_distance;
          }
        }

        let new_bendiness = count_total_bendiness(graph);
        if (new_bendiness > starting_bendiness) {
          for (let node of nodes_in_group) {
            node.y = node.old_y;
          }
        } else {
          starting_bendiness = new_bendiness;
          found = true;
        }
      }
    }
  }
}

function count_total_bendiness(graph) {
  let result = 0;
  for (let node of graph.nodes) {
    let edge = graph.edges.find((e) => e.source.id == node.id);
    if (edge == undefined) continue;
    let target = edge.target;
    if (node.y == undefined || target.y == undefined) continue;
    result += Math.abs(node.y - target.y);
  }
  return result;
}
