import {buildDomainCollections} from '../domains';
import type { Collection } from 'tinacms';
import type { ProjectConfig } from '../../packages/config/project.mjs';
import { campaign } from './campaign';
import { settings } from './settings';import { pages } from './page';import { offering } from './offering';import { person } from './person';import { article } from './article';
export function buildCollections(project:ProjectConfig):Collection[]{return [...buildDomainCollections(project),settings(project),pages(project),offering(project),person(project),...(project.articles?[article(project)]:[]),...(project.profile==='enquiries'?[]:[campaign(project)])];}
