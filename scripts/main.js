/**
 * ©2018 Thanh Tran
 *
 * Initially based on the collapsible tree example: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
 */
$(() => {
	// Instead of window.innerWidth/innerHeight, measure the target container
    const contentDiv = document.getElementById('content');
    const width = contentDiv.clientWidth;
    const height = contentDiv.clientHeight
	const duration = 750;
	const boxW = 150;
	const boxH = 80;
	const spouseSpace = 85; // space between 2 spouses box from center

	let data = {
		name: 'Top Level',
	};
	let root;
	let i = 0;

	const linkColors = d3
		.scaleLinear()
		.domain([1, 4, 8])
		.range(['#00441b', '#29851F', '#7EA31E']);

	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	let svg = d3
        .select('#tree')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // ADD THIS BLOCK: Create the circular mask for photos
    const defs = svg.append('defs');
    defs.append('clipPath')
        .attr('id', 'avatar-clip')
        .attr('clipPathUnits', 'objectBoundingBox')
        .append('circle')
        .attr('cx', 0.5)
        .attr('cy', 0.5)
        .attr('r', 0.5);

	const rectBg = svg
		.append('rect')
		.attr('width', width)
		.attr('height', height)
		.classed('chart-bg', true);

	svg = svg.append('g').attr('class', 'tree-container');

	// const zoom = d3
	// 	.zoom()
	// 	.scaleExtent([0.4, 4])
	// 	.on('zoom', () => {
	// 		// console.log('on zoom', d3.event.transform);
	// 		svg.attr('transform', d3.event.transform);
	// 	});

	// // this is the correct way to set initial scale and translate
	// rectBg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(90, height / 2).scale(1));

	// // FIXME: debug
	// window.svg = svg;
	// window.zoom = zoom;
	// window.rectBg = rectBg;
	// window.data = data;

	// $.get('data/familytree.yml').done(dataStr => {
	// 	// console.log(dataStr);
	// 	data = jsyaml.load(dataStr);

	// 	// Assigns parent, children, height, depth
	// 	root = d3.hierarchy(data, d => d.children);
	// 	root.x0 = height / 2;
	// 	root.y0 = 0;

	// 	// Collapse after the second level
	// 	root.children.forEach(collapse);

	// 	update(root);
	// });
		// Define the zoom behavior with scale extent
	const zoom = d3.zoom()
		.scaleExtent([0.5, 5]) // Allow zooming out to 0.5x and zooming in to 5x
		.on('zoom', () => {
			svg.attr('transform', d3.event.transform);
		});
	
	// Apply the zoom behavior to the rectBg element
	rectBg.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1));
	// FIXME: debug
	window.svg = svg;
	window.zoom = zoom;
	window.rectBg = rectBg;
	window.data = data;
	
	$.get('data/familytree.yml').done(dataStr => {
		// console.log(dataStr);
		data = jsyaml.load(dataStr);
	
		// Assigns parent, children, height, depth
		root = d3.hierarchy(data, d => d.children);
		root.x0 = height / 2;
		root.y0 = 0;
	
		// Collapse after the second level
		root.children.forEach(collapse);
	
		update(root);
	});
	
	// declares a tree layout and assigns the size

	const treemap = d3
		.tree()
		.size([height, width])
		.nodeSize([boxH, boxW])
		.separation(function(a, b) {
			// leave some space for the spouse block
			if (b.data.spouse) {
				if (a.data.spouse) {
					// both a & b has spouse blocks
					return 3.5;
				}
				// only b has spouse block
				return 2.5;
			} else if (a.data.spouse) {
				// only a has spouse block
				return 2.5;
			} else if (a.parent === b.parent) {
				// single siblings are close to save space
				return 1.2;
			}

			//else (single cousins)
			return 2;
		});

	// Collapse the node and all it's children
	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			// expand all by default
			d.children = null;
		}
	}

	function update(source) {
		// Assigns the x and y position for the nodes
		const treeData = treemap(root);

		// Compute the new tree layout.
		const nodes = treeData.descendants();
		const links = treeData.descendants().slice(1);
		// console.log('treeData', treeData);

		// Normalize for fixed-depth.
		nodes.forEach(d => {
			d.y = d.depth * 250;
		});

		// ****************** Nodes section ***************************

		// Update the nodes...
		const node = svg.selectAll('g.node').data(nodes, d => d.id || (d.id = ++i));

		// Enter any new modes at the parent's previous position.
		const nodeEnter = node
			.enter()
			.insert('g', ':first-child') // children should be below parents so that the transition looks nicer
			.attr('class', d => (d._children ? 'node node--has-children' : 'node'))
			.attr('transform', () => `translate(${source.y0},${source.x0})`)
			.on('click', click);

		// Add person block
		const personBlock = nodeEnter.append('g').attr('transform', d => {
			return d.data.spouse ? `translate(0, ${-spouseSpace / 2})` : 'translate(0, 0)';
		});

		// Add Rectangle as text box for the nodes
		// 1. The Box
        personBlock
            .append('rect')
            .attr('x', d => (d.data.boxW ? -d.data.boxW / 2 : -boxW / 2))
            .attr('y', -boxH * 0.5) // Starts at -40 (since boxH is 80)
            .attr('width', d => d.data.boxW || boxW)
            .attr('height', boxH)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('class', d => {
                const gender = String(d.data.gender).toLowerCase();
                if (gender === 'female') return 'box box--female';
                if (gender === 'male') return 'box box--male';
                return 'box';
            });

        // 2. The Photo
        personBlock
            .append('image')
            .attr('href', d => d.data.image ? d.data.image : 'images/placeholder.png')
            .attr('x', -20)
            .attr('y', -35) // Anchored near the top of the rect
            .attr('width', 40)
            .attr('height', 40)
            .attr('clip-path', 'url(#avatar-clip)');

        // 3. The Text
        personBlock
            .append('text')
            .classed('node-name', true)
            .attr('y', 20) // Absolute Y position below the image
            .attr('text-anchor', 'middle')
            .text(d => d.data.name);
		
		// Info Button Background (Main Node)
        personBlock.append('circle')
            .attr('cx', boxW / 2 - 15) // Position in top right corner
            .attr('cy', -boxH / 2 + 15)
            .attr('r', 10)
            .attr('fill', '#ffffff')
            .attr('stroke', '#3871c2')
            .style('cursor', 'pointer')
            .on('click', function(d) {
                d3.event.stopPropagation(); // Stops the tree from expanding/collapsing
                openNodeModal(d.data, false);
            });

        // Info Button Text 'i' (Main Node)
        personBlock.append('text')
            .attr('x', boxW / 2 - 15)
            .attr('y', -boxH / 2 + 19)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#3871c2')
            .style('cursor', 'pointer')
            .text('i')
            .on('click', function(d) {
                d3.event.stopPropagation();
                openNodeModal(d.data, false);
            });

		const nodeHasSpouse = nodeEnter.filter(d => !!d.data.spouse);

		// spouse link
		nodeHasSpouse
			.insert('line', ':first-child')
			.attr('class', 'link')
			.attr('stroke', d => {
				return linkColors(d.depth);
			})
			.attr('x1', 0)
			.attr('y1', -spouseSpace / 2)
			.attr('x2', 0)
			.attr('y2', spouseSpace / 2);

		// Add spouse block
		const spouseBlock = nodeHasSpouse.append('g').attr('transform', `translate(0, ${spouseSpace / 2})`);

		// Spouse Rectangle
        spouseBlock
            .append('rect')
            .attr('x', d => `${d.data.boxW ? -d.data.boxW / 2 : -boxW / 2}`)
            .attr('y', -boxH * 0.5)
            .attr('width', d => d.data.boxW || boxW)
            .attr('height', boxH)
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('stroke', 'green')
            .attr('fill', 'lightgreen')
			.attr('class', 'spouse-box');

        // Spouse Photo
        spouseBlock
            .append('image')
            .attr('href', d => (d.data.spouse && d.data.spouse.image) ? d.data.spouse.image : 'images/placeholder-female.png')
            .attr('x', -20)
            .attr('y', -35)
            .attr('width', 40)
            .attr('height', 40)
            .attr('clip-path', 'url(#avatar-clip)');

        // Spouse Text
        spouseBlock
            .append('text')
            .classed('spouse-name', true)
            .attr('y', 20) // Shift down to fit under the photo
            .attr('text-anchor', 'middle')
            .attr('style', d => {
                const name = d.data.spouse.name || d.data.spouse;
                if (name.includes('&')) return 'font-size: 10px';
            })
            .text(d => `⚭ ${d.data.spouse.name || d.data.spouse}`);

		// Info Button Background (Spouse Node)
        spouseBlock.append('circle')
            .attr('cx', boxW / 2 - 15)
            .attr('cy', -boxH / 2 + 15)
            .attr('r', 10)
            .attr('fill', '#ffffff')
            .attr('stroke', 'green')
            .style('cursor', 'pointer')
            .on('click', function(d) {
                d3.event.stopPropagation();
                openNodeModal(d.data, true); // true = isSpouse
            });

        // Info Button Text 'i' (Spouse Node)
        spouseBlock.append('text')
            .attr('x', boxW / 2 - 15)
            .attr('y', -boxH / 2 + 19)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', 'green')
            .style('cursor', 'pointer')
            .text('i')
            .on('click', function(d) {
                d3.event.stopPropagation();
                openNodeModal(d.data, true);
            });
		
		// Add expand indicator
		nodeEnter
			.filter(d => !!d._children)
			.append('text')
			.classed('expand-icon', true)
			.attr('text-anchor', 'middle')
			.attr('x', boxW / 2 + 10)
			.attr('y', 5) // shift middle
			.attr('visibility', d => (d.children ? 'hidden' : 'visible'))
			.text('⊕');

		// UPDATE
		const nodeUpdate = nodeEnter.merge(node);

		// Transition to the proper position for the node
		nodeUpdate
			.transition()
			.duration(duration)
			.attr('transform', d => `translate(${d.y},${d.x})`);

		// Update the expand / close indicator
		nodeUpdate.selectAll('text.expand-icon').attr('visibility', d => (d.children ? 'hidden' : 'visible'));

		// Remove any exiting nodes
		const nodeExit = node
			.exit()
			.transition()
			.duration(duration)
			.attr('transform', () => `translate(${source.y},${source.x})`)
			.remove();

		// On exit reduce the opacity of text labels
		nodeExit.selectAll('text').style('fill-opacity', 0);

		// ****************** links section ***************************
		const connector = elbow;

		// Update the links...
		const link = svg.selectAll('path.link').data(links, d => d.id);

		// Enter any new links at the parent's previous position.
		const linkEnter = link
			.enter()
			.insert('path', 'g')
			.attr('class', 'link')
			.attr('stroke', d => {
				return linkColors(d.depth);
			})
			.attr('d', () => {
				const o = { x: source.x0, y: source.y0 };
				return connector(o, o);
			});

		// UPDATE
		const linkUpdate = linkEnter.merge(link);

		// Transition back to the parent element position
		linkUpdate
			.transition()
			.duration(duration)
			.attr('d', d => {
				if (d.data.spouse) {
					// move link start (at child) a bit up since it is at new position
					// because of spouse
					return connector({ y: d.y, x: d.x - spouseSpace / 2 }, d.parent);
				}
				return connector(d, d.parent);
			});

		// Remove any exiting links
		link
			.exit()
			.transition()
			.duration(duration)
			.attr('d', () => /*d*/ {
				const o = { x: source.x, y: source.y };
				return connector(o, o);
			})
			.remove();

		// Store the old positions for transition.
		nodes.forEach(d => {
			d.x0 = d.x;
			d.y0 = d.y;
		});

		// pan the tree to center the node
		// NOTE: panning during click doesn't look right, disable for now
		// if (source) {
		// 	rectBg
		// 		.transition()
		// 		.duration(1000)
		// 		.call(zoom.transform, d3.zoomIdentity.translate(width / 2 - source.y, height / 2 - source.x).scale(1));
		// }
	} // end of update()

	// Creates a curved (diagonal) path from parent to the child nodes (UNUSED)
	// eslint-disable-next-line
	function diagonal(s, d) {
		const path = `M ${s.y} ${s.x}
			C ${s.y + (d.y - s.y) * 0.8} ${s.x},
			  ${s.y + (d.y - s.y) * 0.1} ${d.x},
			  ${d.y} ${d.x}`;

		return path;
	}

	// Mind that we are drawing with x & y swapped to turn the tree horizontal
	function elbow(s, d) {
		const hy = (s.y - d.y) / 2;
		return `M${d.y},${d.x} H${d.y + hy} V${s.x} H${s.y}`;
	}

	// Toggle children on click and auto-center
    function click(d) {
        if (d3.event && d3.event.defaultPrevented) return; // click suppressed

        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);

        const scale = d3.zoomTransform(svg.node()).k || 1;
        rectBg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(width / 2 - d.y * scale, height / 2 - d.x * scale).scale(scale));
    }

	// Dedicated function to open the modal
    function openNodeModal(data, isSpouse = false) {
        let name, image, bio, spouseName;
        
        if (isSpouse) {
            name = data.spouse.name || data.spouse;
            image = data.spouse.image || 'images/placeholder-female.png';
            bio = data.spouse.bio || 'No additional bio provided.';
            spouseName = data.name; // The main node is their spouse
        } else {
            name = data.name;
            image = data.image || 'images/placeholder.png';
            bio = data.bio || 'No additional bio provided.';
            spouseName = data.spouse ? (data.spouse.name || data.spouse) : 'N/A';
        }

        document.getElementById('modalName').textContent = name || 'Unknown';
        document.getElementById('modalImage').src = image;
        document.getElementById('modalBio').textContent = bio;
        document.getElementById('modalSpouseText').textContent = spouseName;

        $('#nodeDetailsModal').modal('show');
    }

	// Deep Search Functionality with Exact Match Priority & Spouse Recognition
    let lastSearchTerm = "";
    let searchResults = [];
    let currentSearchIndex = 0;

    $('#searchNodeInput').on('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = $(this).val().toLowerCase().trim();
            if (!searchTerm) return;

            if (searchTerm !== lastSearchTerm) {
                lastSearchTerm = searchTerm;
                searchResults = [];
                currentSearchIndex = 0;

                // 1. Collect ALL matches and flag if it's a spouse
                function searchTree(node) {
                    const nodeName = node.data.name ? node.data.name.toLowerCase() : '';
                    const spouseName = node.data.spouse ? (node.data.spouse.name || node.data.spouse).toLowerCase() : '';

                    const matchMain = nodeName.includes(searchTerm);
                    const matchSpouse = spouseName.includes(searchTerm);

                    if (matchMain) searchResults.push({ node: node, isSpouseMatch: false });
                    if (matchSpouse) searchResults.push({ node: node, isSpouseMatch: true });

                    if (node.children) node.children.forEach(searchTree);
                    if (node._children) node._children.forEach(searchTree);
                }
                
                searchTree(root);

                // 2. Sort results so EXACT matches appear first
                searchResults.sort((a, b) => {
                    const aNameStr = a.isSpouseMatch ? 
                        (a.node.data.spouse.name || a.node.data.spouse).toLowerCase() : 
                        (a.node.data.name || '').toLowerCase();
                    const bNameStr = b.isSpouseMatch ? 
                        (b.node.data.spouse.name || b.node.data.spouse).toLowerCase() : 
                        (b.node.data.name || '').toLowerCase();
                    
                    const aExact = aNameStr === searchTerm ? 1 : 0;
                    const bExact = bNameStr === searchTerm ? 1 : 0;
                    
                    return bExact - aExact; 
                });
            } else {
                currentSearchIndex++;
                if (currentSearchIndex >= searchResults.length) currentSearchIndex = 0;
            }

            if (searchResults.length > 0) {
                const targetObj = searchResults[currentSearchIndex];
                const targetNode = targetObj.node;

                // Expand parents
                let parent = targetNode.parent;
                while (parent) {
                    if (parent._children) {
                        parent.children = parent._children;
                        parent._children = null;
                    }
                    parent = parent.parent;
                }
                
                update(root);

                // Pan and zoom
                const scale = 1.5; 
                rectBg.transition()
                    .duration(1000)
                    .call(zoom.transform, d3.zoomIdentity.translate(width / 2 - targetNode.y * scale, height / 2 - targetNode.x * scale).scale(scale));
                
                // Reset all previous highlights
                d3.selectAll('.box').style('fill', d => String(d.data.gender).toLowerCase() === 'female' ? '#ffd6ee' : '#d6ddff');
                d3.selectAll('.spouse-box').style('fill', 'lightgreen');

                // Highlight the specific matched box (Main or Spouse)
                if (targetObj.isSpouseMatch) {
                    d3.selectAll('.spouse-box')
                        .filter(d => d.data.name === targetNode.data.name)
                        .transition().duration(500).style('fill', '#ffeeb0') // Highlight
                        .transition().duration(2000).style('fill', 'lightgreen'); // Fade back
                } else {
                    d3.selectAll('.box')
                        .filter(d => d.data.name === targetNode.data.name)
                        .transition().duration(500).style('fill', '#ffeeb0')
                        .transition().duration(2000).style('fill', d => String(d.data.gender).toLowerCase() === 'female' ? '#ffd6ee' : '#d6ddff');
                }
                    
                $('#searchNodeInput').attr('placeholder', `Match ${currentSearchIndex + 1} of ${searchResults.length}... (Press Enter for next)`);
                
            } else {
                alert("Family member not found.");
                $('#searchNodeInput').attr('placeholder', 'Search for a family member and press Enter...');
                lastSearchTerm = ""; 
            }
        }
    });
    
    $('#searchNodeInput').on('input', function() {
        $(this).attr('placeholder', 'Search for a family member and press Enter...');
    });
});
