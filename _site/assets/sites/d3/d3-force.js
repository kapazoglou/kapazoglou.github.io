//FORCE
function rectCollide() {
    var nodes, sizes, masses
    var size = constant([0, 0])
    var strength = 1
    var iteratns = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iteratns) {
            iterate()
        }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)

                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index <= node.index) {
                    return
                }

                var x = xi - xCenter(data)
                var y = yi - yCenter(data)
                var xd = Math.abs(x) - xSize
                var yd = Math.abs(y) - ySize

                if (xd < 0 && yd < 0) {
                    var l = Math.sqrt(x * x + y * y)
                    var m = masses[data.index] / (mass + masses[data.index])

                    if (Math.abs(xd) < Math.abs(yd)) {
                        node.vx -= (x *= xd / l * strength) * m
                        data.vx += x * (1 - m)
                    } else {
                        node.vy -= (y *= yd / l * strength) * m
                        data.vy += y * (1 - m)
                    }
                }
            }

            return x0 > xi + xSize || y0 > yi + ySize ||
                x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) {
        return d.x + sizes[d.index][0] / 2
    }

    function yCenter(d) {
        return d.y + sizes[d.index][1] / 2
    }

    force.initialize = function(d) {
        sizes = (nodes = d).map(size)
        masses = sizes.map(function(d) {
            return d[0] * d[1]
        })
    }

    force.size = function(d) {
        return (arguments.length ? (size = typeof d === 'function' ? d : constant(d), force) : size)
    }

    force.strength = function(d) {
        return (arguments.length ? (strength = +d, force) : strength)
    }

    force.iteratns = function(d) {
        return (arguments.length ? (iteratns = +d, force) : iteratns)
    }
    return force
}

function boundedBox() {
    var nodes, sizes
    var bounds
    var size = constant([0, 0])

    function force() {
        var node, size
        var xi, x0, x1, yi, y0, y1
        var i = -1
        while (++i < nodes.length) {
            node = nodes[i]
            size = sizes[i]
            xi = node.x + node.vx
            x0 = bounds[0][0] - xi
            x1 = bounds[1][0] - (xi + size[0])
            yi = node.y + node.vy
            y0 = bounds[0][1] - yi
            y1 = bounds[1][1] - (yi + size[1])
            if (x0 > 0 || x1 < 0) {
                node.x += node.vx
                node.vx = -node.vx
                if (node.vx < x0) {
                    node.x += x0 - node.vx
                }
                if (node.vx > x1) {
                    node.x += x1 - node.vx
                }
            }
            if (y0 > 0 || y1 < 0) {
                node.y += node.vy
                node.vy = -node.vy
                if (node.vy < y0) {
                    node.vy += y0 - node.vy
                }
                if (node.vy > y1) {
                    node.vy += y1 - node.vy
                }
            }
        }
    }

    force.initialize = function(d) {
        sizes = (nodes = d).map(size)
    }

    force.bounds = function(d) {
        return (arguments.length ? (bounds = d, force) : bounds)
    }

    force.size = function(d) {
        return (arguments.length ? (size = typeof d === 'function' ? d : constant(d), force) : size)
    }
    return force
}

function constant(d) {
    return function() {
        return d
    }
}