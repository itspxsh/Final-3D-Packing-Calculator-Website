import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 80;

const DIVISIONS = 5;
const labelMeshes = [];
const rulerGroup = new THREE.Group();
const boxesGroup = new THREE.Group();
const light = new THREE.AmbientLight(0x404040);
scene.add(light);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



// start switch status
window.addEventListener('load', function () {
    // เลือก switch โดยใช้ id หรือ class ของมัน
    const switchElement = document.querySelector('.switch input');

    // ตั้งค่าให้ switch อยู่ในสถานะปิดตอนเปิดเว็บ
    switchElement.checked = false;

    // ตรวจสอบสถานะของ switch และตั้งค่า packedBoxesInfo ให้ปิด
    const packedBoxesInfo = document.getElementById("packedBoxesInfo");
    packedBoxesInfo.style.display = "none";  // เริ่มต้นให้ packedBoxesInfo ซ่อนอยู่

    const box = document.getElementsByClassName("box");
    box.style.display = "none";  // เริ่มต้นให้ box ซ่อนอยู่

    const space = document.getElementById("space");
    space.style.display = "none";  // เริ่มต้นให้ space ซ่อนอยู่
});

document.querySelector(".switch input").addEventListener("change", function (e) {
    const packedBoxesInfo = document.getElementById("packedBoxesInfo");
    const boxes = document.getElementsByClassName("box"); // คืนค่า HTMLCollection
    const space = document.getElementById("space");

    if (e.target.checked) {
        packedBoxesInfo.style.display = "block";
        setTimeout(() => packedBoxesInfo.classList.add('show'), 10);

        // ใช้ Array.from เพื่อแปลง HTMLCollection เป็น Array แล้ววนลูป
        Array.from(boxes).forEach(box => {
            box.style.display = "block";
            setTimeout(() => box.classList.add('show'), 10);
        });

        space.style.display = "block";
        setTimeout(() => space.classList.add('show'), 10);
    } else {
        packedBoxesInfo.classList.remove('show');
        setTimeout(() => packedBoxesInfo.style.display = "none", 300);

        Array.from(boxes).forEach(box => {
            box.classList.remove('show');
            setTimeout(() => box.style.display = "none", 300);
        });

        space.classList.remove('show');
        setTimeout(() => space.style.display = "none", 300);
    }
});

// end switch status



// start input
let boxCount = 1;

document.getElementById("addBoxBtn").addEventListener("click", () => {
    if (boxCount < 100) {
        // Create a new table row
        const newBoxRow = document.createElement("tr");
        newBoxRow.classList.add("boxInput");
        newBoxRow.innerHTML = ` 
            <td class="order">${boxCount + 1}</td>
            <td><input type="text" id="boxName${boxCount}" required /></td>
            <td><input type="number" id="length${boxCount}" required /></td>
            <td><input type="number" id="width${boxCount}" required /></td>
            <td><input type="number" id="height${boxCount}" required /></td>
            <td><input type="number" id="weight${boxCount}" required /></td>
            <td><input type="number" id="quantity${boxCount}" required /></td>
            <td><select id="fragile${boxCount}" required>
                <option value="false">Not Fragile</option>
                <option value="true">Fragile</option>
            </select></td>
            <td><button type="button" class="deleteBtn"><i class='bx bx-trash' ></i></button></td>
        `;

        // Append the new row to the table body
        const tableBody = document.querySelector("#boxTable tbody");
        tableBody.appendChild(newBoxRow);

        // Add an input listener for the quantity field
        const quantityInput = document.getElementById(`quantity${boxCount}`);
        quantityInput.addEventListener("input", function () {
            let quantity = parseInt(this.value, 10);
            if (quantity < 1) {
                this.value = 1;
            }
        });

        // Increment box count
        boxCount++;
    } else {
        alert("You can only add up to 100 boxes.");
    }
});

// Use event delegation for delete button
document.querySelector("#boxTable tbody").addEventListener("click", (e) => {
    if (e.target.classList.contains("deleteBtn")) {
        const row = e.target.closest("tr");
        row.remove();
        updateOrder(); // Update order after deleting a row
    }
});

// Update order function
function updateOrder() {
    const rows = document.querySelectorAll("#boxTable tbody .boxInput");
    rows.forEach((row, index) => {
        row.querySelector(".order").textContent = index + 1;

        // อัปเดต id ของ input ในแถว
        row.querySelectorAll("input, select").forEach((input) => {
            const oldId = input.id;
            if (oldId) {
                const newId = oldId.replace(/\d+$/, index);
                input.id = newId;
            }
        });
    });
    boxCount = rows.length; // อัปเดต boxCount
}
// end input



async function calculatePacking() {
    const boxes = [];
    const boxesContainer = document.getElementById("boxes");

    const baseLength = parseFloat(document.getElementById("baseLength").value);
    const baseWidth = parseFloat(document.getElementById("baseWidth").value);
    const baseHeight = parseFloat(document.getElementById("baseHeight").value);

    if (!baseLength || !baseWidth || !baseHeight) {
        alert("Please enter valid dimensions for the base box.");
        return;
    }

    scrollToBottom();

    const boxInputs = boxesContainer.getElementsByClassName("boxInput");
    for (let i = 0; i < boxInputs.length; i++) {
        const name = boxInputs[i].querySelector(`#boxName${i}`).value;
        const quantity = parseInt(boxInputs[i].querySelector(`#quantity${i}`).value) || 1;
        const length = boxInputs[i].querySelector(`#length${i}`);
        const width = boxInputs[i].querySelector(`#width${i}`);
        const height = boxInputs[i].querySelector(`#height${i}`);
        const weight = boxInputs[i].querySelector(`#weight${i}`);
        const fragileDropdown = boxInputs[i].querySelector(`#fragile${i}`);

        if (!name || !length.value || !width.value || !height.value || !weight.value || !fragileDropdown) {
            alert(`Box ${i + 1} has invalid or missing data.`);
            return;
        }

        const fragile = fragileDropdown.value === "true";

        for (let q = 0; q < quantity; q++) {
            boxes.push({
                name: name,
                length: parseFloat(length.value),
                width: parseFloat(width.value),
                height: parseFloat(height.value),
                weight: parseFloat(weight.value),
                fragile: fragile
            });
        }
    }

    if (boxes.length === 0) {
        alert("Please enter at least one box.");
        return;
    }

    const requestBody = {
        base_dimensions: [baseWidth, baseHeight, baseLength],
        boxes
    };
    console.log("Request Body:", requestBody);

    try {
        const response = await fetch("http://127.0.0.1:5000/calculate_packing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error || "Failed to calculate packing");
        }

        const packedBoxes = await response.json();
        console.log("Packed boxes data:", packedBoxes);

        // Show packed details with transition effect
        const boxInfoContainer = document.getElementById("packedBoxesInfo");
        boxInfoContainer.innerHTML = '';

        // Ensure the packedBoxesInfo container is visible with a smooth transition
        boxInfoContainer.style.display = "block";  // Make it visible
        setTimeout(() => boxInfoContainer.classList.add('show'), 10);  // Add transition class

        visualizePacking(packedBoxes, baseWidth, baseHeight, baseLength);
    } catch (error) {
        console.error("Error:", error);
        alert(error.message || "There was an error while calculating the packing. Please try again.");
    }
}


// start visualize
function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}

function visualizePacking(responseData, baseWidth, baseHeight, baseLength) {
    const packedBoxes = responseData.packed_boxes;
    const spaceStats = calculateSpaceUsage(packedBoxes, baseWidth, baseHeight, baseLength);

    // Clear previous info
    const boxInfoContainer = document.getElementById("packedBoxesInfo");
    boxInfoContainer.innerHTML = `
        <h2>Packing Details</h2>
        <div class="space-stats">
            <h3>Space Usage</h3>
            <div class="stat-item">
                <span>Space Used:</span>
                <span>${spaceStats.spaceUsed.toFixed(2)}%</span>
            </div>
            <div class="stat-item">
                <span>Space Remaining:</span>
                <span>${spaceStats.spaceRemaining.toFixed(2)}%</span>
            </div>
        </div>
        <h3>Packed Items</h3>
    `;

    // <div class="stat-item">
    // <span>Fragile Items:</span>
    // <span>${spaceStats.fragileCount}</span>
    // </div>

    rulerGroup.clear();
    boxesGroup.clear();

    const baseBox = new THREE.BoxGeometry(baseWidth, baseLength, baseHeight);
    const edgesGeometry = new THREE.EdgesGeometry(baseBox);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x0000FF });
    const baseEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    baseEdges.position.set(0, 0, 0);

    rulerGroup.add(baseEdges);
    createDynamicRulerLines([baseWidth, baseLength, baseHeight]);

    packedBoxes.forEach((box) => {
        const geometry = new THREE.BoxGeometry(box.width, box.length, box.height);
        const color = Math.floor(Math.random() * 0xffffff); // ใช้สีแบบสุ่ม
        const material = new THREE.MeshBasicMaterial({ color: color });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            box.x - baseWidth / 2 + box.width / 2,
            box.z - baseLength / 2 + box.length / 2,
            box.y - baseHeight / 2 + box.height / 2
        );

        mesh.userData = {
            name: box.name,
            width: box.width,
            length: box.length,
            height: box.height,
            weight: box.weight,
            fragile: box.fragile,
            color: color // เก็บสีไว้ใน userData
        };

        boxesGroup.add(mesh);

        displayBoxInfo(box, color); // ส่งสีไปในฟังก์ชัน displayBoxInfo
    });

    scene.add(boxesGroup);
}
// end visualize



// start the info tab
function displayBoxInfo(box, color) {
    const boxInfoContainer = document.getElementById("packedBoxesInfo");

    // ถ้ามีข้อมูลกล่องที่ถูกบรรจุแล้ว ให้เพิ่มหัวข้อใหญ่ที่ด้านบน
    if (!boxInfoContainer.hasChildNodes()) {
        const header = document.createElement("h2");
        header.innerText = "Placed Box Details";
        boxInfoContainer.appendChild(header);
    }

    // สร้างแถบข้อมูลของแต่ละกล่อง
    const boxInfoDiv = document.createElement("div");
    boxInfoDiv.classList.add("packedBoxInfo");
    boxInfoDiv.style.padding = "10px";
    boxInfoDiv.style.marginBottom = "10px";
    boxInfoDiv.style.borderRadius = "5px";
    boxInfoDiv.style.borderLeft = `5px solid #${color.toString(16)}`;
    boxInfoDiv.style.fontSize = "14px";

    const position = `<span>Position:</span> (${box.x.toFixed(1)}, ${box.y.toFixed(1)}, ${box.z.toFixed(1)})<br>`;

    // แสดงข้อมูลของกล่อง
    boxInfoDiv.innerHTML = `
    <strong>${box.name}</strong><br>
    <span>Size: ${box.length} × ${box.width} × ${box.height} cm</span><br>
    <span>Weight: ${box.weight} kg</span><br>
    ${position}
    ${box.fragile ? '<span style="color: #ef4444">⚠️ Fragile</span>' : ''}
`;


    boxInfoContainer.appendChild(boxInfoDiv);
}

function calculateSpaceUsage(packedBoxes, baseWidth, baseHeight, baseLength) {
    let spaceUsed = 0;
    let spaceRemaining = 0;
    let fragileCount = 0;

    packedBoxes.forEach(box => {
        // Assuming box dimensions and fragile status
        let boxVolume = box.width * box.height * box.length;
        spaceUsed += boxVolume;

        if (box.isFragile) {
            fragileCount++;
        }
    });

    spaceRemaining = (baseWidth * baseHeight * baseLength) - spaceUsed;
    spaceUsed = (spaceUsed / (baseWidth * baseHeight * baseLength)) * 100;
    spaceRemaining = (spaceRemaining / (baseWidth * baseHeight * baseLength)) * 100;

    return {
        spaceUsed,
        spaceRemaining,
        fragileCount
    };
}

document.querySelector(".switch input").addEventListener("change", function (e) {
    const packedBoxesInfo = document.getElementById("packedBoxesInfo");
    const boxes = document.getElementsByClassName("box"); // ใช้ getElementsByClassName จะคืนค่า HTMLCollection
    const space = document.getElementById("space");

    if (e.target.checked) {
        packedBoxesInfo.style.display = "block";
        setTimeout(() => packedBoxesInfo.classList.add('show'), 10);

        // Loop through each .box element and show it
        Array.from(boxes).forEach(box => {
            box.style.display = "block";
            setTimeout(() => box.classList.add('show'), 10);
        });

        space.style.display = "block";
        setTimeout(() => space.classList.add('show'), 10);
    } else {
        packedBoxesInfo.classList.remove('show');
        setTimeout(() => packedBoxesInfo.style.display = "none", 300);

        // Loop through each .box element and hide it
        Array.from(boxes).forEach(box => {
            box.classList.remove('show');
            setTimeout(() => box.style.display = "none", 300);
        });

        space.classList.remove('show');
        setTimeout(() => space.style.display = "none", 300);
    }
});
// end the info tab



function addLabel(value, axis, position, sizeTuple) {
    const fontLoader = new THREE.FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new THREE.TextGeometry(value.toString(), {
            font: font,
            size: 0.75,
            height: 0.1,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x0000FF });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        if (axis === 0) {
            textMesh.position.set(position, -sizeTuple[1] / 2 - 2, -sizeTuple[2] / 2);
        } else if (axis === 1) {
            textMesh.position.set(-sizeTuple[0] / 2 - 2, position, -sizeTuple[2] / 2);
        } else if (axis === 2) {
            textMesh.position.set(-sizeTuple[0] / 2, -sizeTuple[1] / 2 - 2, position);
        }
        rulerGroup.add(textMesh);
        labelMeshes.push(textMesh);
    });
}

function updateLabels() {
    labelMeshes.forEach((label) => {
        label.lookAt(camera.position);
    });
}

function createDynamicRulerLines(sizeTuple) {
    for (let axis = 0; axis < 3; axis++) {
        for (let i = 0; i <= DIVISIONS; i++) {
            const interval = sizeTuple[axis] / DIVISIONS;
            const position = i * interval - sizeTuple[axis] / 2;
            const axisVector = [new THREE.Vector3(), new THREE.Vector3()];

            if (axis === 0) {
                axisVector[0].set(position, -sizeTuple[1] / 2, -sizeTuple[2] / 2);
                axisVector[1].set(position, -sizeTuple[1] / 2 - 1, -sizeTuple[2] / 2);
            } else if (axis === 1) {
                axisVector[0].set(-sizeTuple[0] / 2, position, -sizeTuple[2] / 2);
                axisVector[1].set(-sizeTuple[0] / 2 - 1, position, -sizeTuple[2] / 2);
            } else if (axis === 2) {
                axisVector[0].set(-sizeTuple[0] / 2, -sizeTuple[1] / 2, position);
                axisVector[1].set(-sizeTuple[0] / 2, -sizeTuple[1] / 2 - 1, position);
            }

            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000FF });
            const geometry = new THREE.BufferGeometry().setFromPoints(axisVector);
            const line = new THREE.Line(geometry, lineMaterial);
            rulerGroup.add(line);

            addLabel(i * interval, axis, position, sizeTuple);
        }
    }

    scene.add(rulerGroup);
}

renderer.setAnimationLoop(() => {
    updateLabels();
    renderer.render(scene, camera);
});

const raycaster = new THREE.Raycaster();
const tooltip = document.getElementById("tooltip");

document.addEventListener("mousemove", (event) => {
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
    );

    raycaster.setFromCamera(coords, camera);

    const intersections = raycaster.intersectObjects(boxesGroup.children, true);

    boxesGroup.children.forEach(obj => {
        obj.material.opacity = 0.5;
        obj.material.transparent = true;
    });

    if (intersections.length > 0) {
        const selectedObject = intersections[0].object;
        const properties = selectedObject.userData;

        selectedObject.material.opacity = 1.0;

        tooltip.innerHTML = `
            <strong>Name: </strong>${properties.name || 'N/A'}<br>
            <strong>Size: </strong>${properties.width} x ${properties.length} x ${properties.height}<br>
            <strong>Weight: </strong>${properties.weight} Kg<br>
            <strong>Fragile: </strong>${properties.fragile ? "Yes" : "No"}
        `;
        tooltip.style.left = `${event.clientX + 30}px`;
        tooltip.style.top = `${event.clientY + 550}px`;
        tooltip.style.display = "block";
    } else {
        tooltip.style.display = "none";
    }
});


document.getElementById("calculateBtn").addEventListener("click", function () {
    calculatePacking();  // Existing function to calculate packed boxes

    const switchElement = document.querySelector(".switch input");
    const packedBoxesInfo = document.getElementById("packedBoxesInfo");
    const box = document.querySelector('.box'); // The .box div you want to show
    const space = document.getElementById("space");

    // Change switch status to checked
    switchElement.checked = true;

    // Show packedBoxesInfo if switch is selected
    packedBoxesInfo.style.display = switchElement.checked ? "block" : "none";

    // Show unplacedBoxesInfo
    box.classList.add('show'); // Show the box

    // Show space
    space.style.display = "block";
});


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
