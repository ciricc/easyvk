import Plugin from "./plugin";
import VK from "../../vk";

export type PluginIniter = (vk:VK, options:any) => Plugin;