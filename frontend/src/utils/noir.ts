import { compile, createFileManager } from "@noir-lang/noir_wasm";
import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { InputValue } from '@noir-lang/noirc_abi';
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

	const circuit = await compile(fm);
	return circuit;
}

export async function generate_backend() {
	toast.success("Generating backend	... ⏳");
	const { program } = await getCircuit();
	const noir = new Noir(program);
	const backend = new UltraHonkBackend(program.bytecode);
	toast.success("Generated backend... ✅");
	return { noir, backend };
}

export async function generateProof(move: number, nonce: number[]) {
	try {
		toast.success("Generating noir backend... ⏳");
		const { program } = await getCircuit();
		const noir = new Noir(program);
		const backend = new UltraHonkBackend(program.bytecode);
		const { witness, returnValue } = await noir.execute({ move, nonce });
		toast.success("Generating noir proof... ⏳");
		const proof = await backend.generateProof(witness);
		toast.success("Verifying noir proof... ⌛");
		const isValid = await backend.verifyProof(proof);
		toast.success(`Proof is ${isValid ? "valid" : "invalid"}... ✅`);
		return { returnValue, proof};
	} catch (err) {
		toast.error(`${err}`);
	}
}


export async function verifyProof(proof: ProofData) {
	try {
		toast.success("Generating noir backend... ⏳");
		const { program } = await getCircuit();
		const backend = new UltraHonkBackend(program.bytecode);
		toast.success("Verifying proof... ⌛");
		const isValid = await backend.verifyProof(proof);
		toast.success(`Proof is ${isValid ? "valid" : "invalid"}... ✅`);
		return isValid;
	} catch (err) {
		toast.error(`${err}`);
	}
}

export function noir_return_value_to_hex(returnValue: InputValue) {
	return "0x" + Array.from(returnValue as string[])
            .map((b: string) => Number(b).toString(16).padStart(2, "0"))
            .join("");
}
