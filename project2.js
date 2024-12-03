function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		this.diffuseLightLoc = gl.getUniformLocation(this.prog, 'diffuseLight');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');

		this.normalBuffer = gl.createBuffer();
		this.normLoc = gl.getAttribLocation(this.prog, 'normal');	
		
		this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
		this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
		
		// Add these lines to store second texture and its uniform locations
        this.texture = null;
        this.texture2 = null;
        this.texLoc = gl.getUniformLocation(this.prog, 'tex');
        this.tex2Loc = gl.getUniformLocation(this.prog, 'tex2');
        this.blendFactorLoc = gl.getUniformLocation(this.prog, 'blendFactor');
        this.blendFactor = 0.5; // Default blend factor
		this.setAmbientLight(0.5);
		this.setSpecularIntensity(0.5);

	}
	
	setSpecularIntensity(intensity) {
		 //console.log("Updating Specular Intensity in Shader:", intensity); // Log the update
		gl.useProgram(this.prog);
		gl.uniform1f(this.specularIntensityLoc, intensity);
	}


	setViewPosition(viewPos) {
		gl.useProgram(this.prog);
		gl.uniform3fv(this.viewPosLoc, viewPos);
	}

	setShininess(shininess) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
	}


	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		this.numTriangles = vertPos.length / 3;
		if (normalCoords) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
		}
	}
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
		
		// Bind and activate the first texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.texLoc, 0);

        // Bind and activate the second texture if available
        if (this.texture2) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.texture2);
            gl.uniform1i(this.tex2Loc, 1);
            gl.uniform1f(this.blendFactorLoc, this.blendFactor);
        } else {
            gl.uniform1f(this.blendFactorLoc, 0.0); // No blending if second texture is missing
        }
		
		this.setShininess(32.0); 
		this.setViewPosition([0, 0, -5]);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normLoc);
		gl.vertexAttribPointer(this.normLoc, 3, gl.FLOAT, false, 0, 0);
		const ambientLight = [0.5, 0.5, 0.5];
		const diffuseLight = [1.0, 1.0, 1.0];
		const lightPosition = [lightX, lightY, -10.0];
		gl.uniform3fv(this.diffuseLightLoc, diffuseLight);
		gl.uniform3fv(this.lightPosLoc, lightPosition);
		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
        // Create and bind the first texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img
        );

		// Set texture parameters 
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        this.texture = texture; // Store the first texture
    }

    setTexture2(img) {
        // Create and bind the second texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img
        );

        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        this.texture2 = texture; // Store the second texture
    }
	
	setBlendFactor(factor) {
        this.blendFactor = factor;
    }

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}
	
	setAmbientLight(ambient) {
		gl.useProgram(this.prog);

		gl.uniform1f(this.ambientLoc, ambient);
	}
	
	enableLighting(show) {
		gl.useProgram(this.prog);

		const enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		gl.uniform1i(enableLightingLoc, show ? 1 : 0);
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;


// Fragment shader source code
const meshFS = `precision mediump float;

				uniform bool showTex;
				uniform bool enableLighting;
				uniform sampler2D tex;
				uniform sampler2D tex2;      // Second texture sampler
				uniform vec3 color;
				uniform vec3 lightPos;
				uniform float ambient;
				uniform float specularIntensity;
				uniform vec3 viewPos;
				uniform float shininess;
				uniform float blendFactor;   // Blend factor between textures

				varying vec2 v_texCoord;
				varying vec3 v_normal;

				void main()
				{
					vec3 finalColor;

					if (enableLighting) {
						vec3 norm = normalize(v_normal);
						vec3 lightDir = normalize(lightPos - vec3(0.0, 0.0, 0.0));
						vec3 viewDir = normalize(viewPos - vec3(0.0, 0.0, 0.0));

						vec3 ambientLight = vec3(ambient);

						float diff = max(dot(norm, lightDir), 0.0);
						vec3 diffuseLight = diff * vec3(1.0);

						vec3 reflectDir = reflect(-lightDir, norm);
						float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
						if(dot(viewDir, norm) <= 0.0) {
							spec = 0.0;
						} 
						
						vec3 specularLight = specularIntensity * spec * vec3(1.0);

						vec3 lighting = ambientLight + diffuseLight + specularLight;

						if (showTex) {
							vec4 texColor1 = texture2D(tex, v_texCoord);
							vec4 texColor2 = texture2D(tex2, v_texCoord);
							vec3 blendedTexColor = mix(texColor1.rgb, texColor2.rgb, blendFactor);
							finalColor = blendedTexColor * lighting;
						} else {
							finalColor = color * lighting;
						}
					} else {
						finalColor = showTex ? texture2D(tex, v_texCoord).rgb : color;
					}

					gl_FragColor = vec4(finalColor, 1.0);
				}
				`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}

function SetSpecularLight(slider) {
    const intensity = parseFloat(slider.value / 100.0);
    console.log("Specular Intensity:", intensity); // Log the value
    meshDrawer.setSpecularIntensity(intensity);
}

function LoadTexture2(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                meshDrawer.setTexture2(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}