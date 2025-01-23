import { compile, createFileManager } from "@noir-lang/noir_wasm";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import toast from "react-hot-toast";

import main from "../circuit/src/main.nr?url";
import nargoToml from "../circuit/Nargo.toml?url";

export async function getCircuit() {
	const fm = createFileManager("/");
	const {body: mainBody} = await fetch(main);
	const {body: nargoTomlBody} = await fetch(nargoToml);
	
	if (!mainBody || !nargoTomlBody) {
		throw new Error("Failed to fetch circuit files");
	}
	fm.writeFile("./src/main.nr", mainBody);
	fm.writeFile("./Nargo.toml", nargoTomlBody);
	
	// Print file contents
	const circuit = await compile(fm);
	return circuit;
}

export default async function generateProof(age: number) {
	try {
		const { program } = await getCircuit();
		const noir = new Noir(program);
		const backend = new UltraHonkBackend(program.bytecode);
		toast.success("Generating witness... ⏳");
		const { witness } = await noir.execute({ age });
		toast.success("Generated witness... ✅");
		toast.success("Generating proof... ⏳");
		const proof = await backend.generateProof(witness);
		toast.success("Generated proof... ✅");
		toast.success("Verifying proof... ⌛");
		const isValid = await backend.verifyProof(proof);
		toast.success(`Proof is ${isValid ? "valid" : "invalid"}... ✅`);
	} catch (err) {
		toast.error(`${err}`);
	}
}
