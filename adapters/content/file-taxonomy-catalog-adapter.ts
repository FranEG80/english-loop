import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TaxonomyNode } from "@/core/content/domain/taxonomy";
import type { ContentVersion } from "@/core/content/domain/content-version";
import type { TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import { DatasetUnavailableException } from "@/core/shared/exceptions";

interface RawTaxonomyNode {
  id: string;
  parentId: string | null;
  kind: "category" | "topic" | "subtopic" | "skill";
  labels: { en: string; es: string };
  levels: string[];
  selectableForPractice: boolean;
  order: number;
}

interface RawTaxonomy {
  schemaVersion: string;
  nodes: RawTaxonomyNode[];
}

/**
 * Adaptador de taxonomía que lee `DATASET/catalog/taxonomy.json`.
 * Carga y cachea el árbol una vez por proceso.
 */
export class FileTaxonomyCatalogAdapter implements TaxonomyCatalogPort {
  private readonly taxonomyPath: string;
  private readonly datasetVersion: string;
  private treePromise: Promise<TaxonomyNode[]> | null = null;

  constructor(datasetRoot: string, datasetVersion: string) {
    this.taxonomyPath = path.join(datasetRoot, "catalog", "taxonomy.json");
    this.datasetVersion = datasetVersion;
  }

  private async loadTree(): Promise<TaxonomyNode[]> {
    if (this.treePromise) return this.treePromise;
    this.treePromise = this.readTree();
    return this.treePromise;
  }

  private async readTree(): Promise<TaxonomyNode[]> {
    let raw: RawTaxonomy;
    try {
      raw = JSON.parse(
        await readFile(this.taxonomyPath, "utf8"),
      ) as RawTaxonomy;
    } catch {
      throw new DatasetUnavailableException(
        `Unable to read taxonomy at ${this.taxonomyPath}`,
        "Content catalog is unavailable.",
        { path: this.taxonomyPath },
      );
    }

    const byId = new Map<string, RawTaxonomyNode>();
    for (const node of raw.nodes) byId.set(node.id, node);

    const childrenOf = new Map<string, RawTaxonomyNode[]>();
    for (const node of raw.nodes) {
      if (node.parentId === null) continue;
      const siblings = childrenOf.get(node.parentId) ?? [];
      siblings.push(node);
      childrenOf.set(node.parentId, siblings);
    }

    const toDomain = (node: RawTaxonomyNode): TaxonomyNode => {
      const children = (childrenOf.get(node.id) ?? [])
        .sort((a, b) => a.order - b.order)
        .map(toDomain);
      return {
        id: node.id,
        parentId: node.parentId,
        kind: node.kind,
        labels: { en: node.labels.en, es: node.labels.es },
        levels: node.levels as TaxonomyNode["levels"],
        selectableForPractice: node.selectableForPractice,
        order: node.order,
        children,
      };
    };

    return raw.nodes
      .filter((node) => node.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map(toDomain);
  }

  private flatten(nodes: TaxonomyNode[]): TaxonomyNode[] {
    return nodes.flatMap((node) => [node, ...this.flatten(node.children)]);
  }

  async getTaxonomyTree(): Promise<TaxonomyNode[]> {
    return this.loadTree();
  }

  async resolveNodeWithDescendants(nodeId: string): Promise<TaxonomyNode[]> {
    const tree = await this.loadTree();
    const all = this.flatten(tree);
    const target = all.find((node) => node.id === nodeId);
    if (!target) return [];
    return [target, ...this.flatten(target.children)];
  }

  async getNodePath(nodeId: string): Promise<TaxonomyNode[]> {
    const tree = await this.loadTree();
    const all = this.flatten(tree);
    const byId = new Map(all.map((node) => [node.id, node]));
    const target = byId.get(nodeId);
    if (!target) return [];

    const path: TaxonomyNode[] = [];
    let current: TaxonomyNode | undefined = target;
    while (current) {
      path.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return path;
  }

  async getContentVersion(): Promise<ContentVersion> {
    return {
      datasetVersion: this.datasetVersion,
      schemaVersion: "1.0.0",
    };
  }
}
