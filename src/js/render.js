async function render() {
  let subject = "JurassicPark";
  let experiment = "faircross";
  let text = await d3.text(`../data/txt/${subject}.master`);
  let character_list = text.split("\n\n")[0];
  let timesteps = text.split("\n\n")[1];
  // let solution = await d3.text(`../results/${subject}_fair_replaced.sol`);
  //let solution = await d3.text(`../results/${subject}_replaced.sol`);
  let solution = await d3.text(
    `../results/${subject}_${experiment}_replaced.sol`
  );

  let graph = {
    nodes: [],
    edges: [],
  };

  let visualization_options = {
    width: 4000,
    height: 1000,
    padding: { left: 20, right: 20, top: 20, bottom: 20 },
    base_node_vertical_distance: 30,
    reduce_wiggles: true,
    max_reduce_wiggles_iterations: 20,
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
  // let max_timesteps = 5;
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
    space_between_timesteps
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

  // EDGES
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
    // make a path from the line_coords
    let line = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCatmullRom.alpha(0.8));

    svg
      .append("path")
      .datum(line_coords)
      .attr("fill", "none")
      .attr("stroke", character_colors[char])
      .attr("stroke-width", 5)
      .attr("d", line)
      .attr("opacity", () => {
        if (["RM", "DS", "DN"].includes(char)) return 1;
        else return 1;
      });
  }

  // DRAW THE NODES
  for (let i = 0; i < max_timesteps; i++) {
    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);

    for (let j in nodes_at_this_timestep) {
      svg
        .append("circle")
        .attr("r", 5)
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

function assign_node_coordinates(
  timesteps,
  max_timesteps,
  solution_lines,
  graph,
  visualization_options,
  space_between_timesteps
) {
  for (let i = 0; i < max_timesteps; i++) {
    let timestep_line = timesteps.split("\n")[i];
    if (!timestep_line) {
      console.log(`No timestep data for step ${i}`);
      continue;
    }

    let nodes_at_this_timestep = graph.nodes.filter((n) => n.timestep == i);
    let interactions_at_this_timestep = timesteps.split("\n")[i].split(":")[1];

    // console.log(nodes_at_this_timestep.map((n) => n.name));
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

    let interaction_groups = interactions_at_this_timestep
      .split(";")
      .map((group) => group.split(",").map((char) => char.trim()));

    function findInteractionGroup(nodeName) {
      return interaction_groups.find((group) => group.includes(nodeName));
    }

    let baseY = visualization_options.padding.top;
    for (let j = 0; j < nodes_at_this_timestep.length; j++) {
      let curr_node = nodes_at_this_timestep[j];
      curr_node.x =
        i * space_between_timesteps + visualization_options.padding.left;

      if (j == 0) {
        curr_node.y = baseY;
      } else {
        let prev_node = nodes_at_this_timestep[j - 1];
        let curr_group = findInteractionGroup(curr_node.name);
        let prev_group = findInteractionGroup(prev_node.name);

        if (curr_group == prev_group) {
          curr_node.y =
            prev_node.y + visualization_options.base_node_vertical_distance;
        } else {
          curr_node.y =
            prev_node.y + visualization_options.base_node_vertical_distance * 2;
        }
      }
    }
  }

  if (visualization_options.reduce_wiggles)
    iterate_for_better_bendiness(
      graph,
      timesteps,
      max_timesteps,
      visualization_options
    );
}

// this funcition is to be finished still - do not trust
function iterate_for_better_bendiness(
  graph,
  timesteps,
  max_timesteps,
  visualization_options
) {
  let max_iterations = visualization_options.max_reduce_wiggles_iterations;
  let starting_bendiness = count_total_bendiness(graph);

  console.log("starting bendiness", starting_bendiness);

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

      // console.log(j, interaction_groups)

      let found = false;

      for (let g = 0; g < interaction_groups.length; g++) {
        // if (found) break;
        // move all the nodes in the group down, provided that there is space
        let group = interaction_groups[interaction_groups.length - g - 1];
        let nodes_in_group = nodes_at_this_timestep.filter((n) =>
          group.includes(n.name)
        );
        // console.log(j, nodes_in_group.map((n) => n.name));
        let max_y = Math.max(...nodes_in_group.map((n) => n.y));
        // console.log(j, max_y)
        let space_below = 0;

        if (g == 0) {
          space_below = visualization_options.height - max_y;
        } else {
          let next_group = interaction_groups[interaction_groups.length - g];
          // console.log(next_group)
          let nodes_in_next_group = nodes_at_this_timestep.filter((n) =>
            next_group.includes(n.name)
          );
          let min_y_next = Math.min(...nodes_in_next_group.map((n) => n.y));
          space_below = min_y_next - max_y;
        }

        // console.log("space below", space_below)

        if (space_below <= visualization_options.base_node_vertical_distance) {
          continue;
        } else {
          for (let node of nodes_in_group) {
            node.y += visualization_options.base_node_vertical_distance;
          }
        }

        // check if bendiness has improved
        let new_bendiness = count_total_bendiness(graph);
        if (new_bendiness > starting_bendiness) {
          // move all the nodes in the group back up
          for (let node of nodes_in_group) {
            node.y = node.old_y;
          }
        } else {
          starting_bendiness = new_bendiness;
          found = true;
        }
      }
    }

    console.log(
      "bendiness at end of iteration",
      i,
      count_total_bendiness(graph)
    );
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

render();
