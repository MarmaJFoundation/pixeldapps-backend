import { Vector2 } from "../../common/utils";
import { getMapByType, getUnitByType } from "../helper/utils";
import { ActionStruct, FightNode, FightStruct, IActionStruct, ResolveActionOnNodeResult, TileInfo, TileType, UnitBehaviorResult, UnitData, UnitFightInfo, UnitInfo, UnitType } from "./types";
import { OutOfBounds } from './utils'

export const mapWidth: number = 29;
export const mapHeight: number = 13;

export const mapWidthOffset: number = 14;
export const mapHeightOffset: number = 7;

export class BattleController {
    yellowUnits: UnitFightInfo[] = [];
    purpleUnits: UnitFightInfo[] = [];
    neighbourNodes: FightNode[] = [];
    actionStructs: ActionStruct[] = [];
    nodeGrid: FightNode[][];

    constructor() {
        this.nodeGrid = [];

        for (let x: number = 0; x < mapWidth; x++) {
            this.nodeGrid[x] = [];

            for (let y: number = 0; y < mapHeight; y++) {
                this.nodeGrid[x][y] = null;
            }
        }
    }

    GenerateFightStruct(
        mapIndex: number,
        purpleUnitInfos: UnitInfo[],
        purplePositions: Vector2[],
        yellowUnitInfos: UnitInfo[],
        yellowPositions: Vector2[]
    ): FightStruct {
        const mapData = getMapByType(mapIndex);

        for (let i: number = 0; i < mapData.tile_infos.length; i++) {
            const tileInfo: TileInfo = mapData.tile_infos[i];

            const rawPos: Vector2 = tileInfo.position;
            const nodeInfo: FightNode = {
                position: new Vector2(
                    rawPos.x + mapWidthOffset,
                    rawPos.y + mapHeightOffset
                ),
                blocked: tileInfo.blocked,
                tileType: tileInfo.tile_type,
                unit: null,
                bodies: []
            } as FightNode;

            this.nodeGrid[nodeInfo.position.x][nodeInfo.position.y] = nodeInfo;
        }

        for (let i: number = 0; i < purpleUnitInfos.length; i++) {
            this.AddUnit(true, this.nodeGrid[purplePositions[i].x][purplePositions[i].y], purpleUnitInfos[i]);
        }

        for (let i: number = 0; i < yellowUnitInfos.length; i++) {
            this.AddUnit(false, this.nodeGrid[yellowPositions[i].x][yellowPositions[i].y], yellowUnitInfos[i]);
        }

        let breaker: number = 1000;

        while (this.HasUnits(this.purpleUnits) && this.HasUnits(this.yellowUnits)) {
            if (--breaker < 0) {
                console.log("broke!");
                break;
            }

            for (let i: number = 0; i < this.purpleUnits.length; i++) {
                const behaviorResult: UnitBehaviorResult = this.ProcessUnitBehavior(this.purpleUnits[i]);
                if (behaviorResult.success) {
                    this.actionStructs.push(behaviorResult.actionStruct);
                }
            }

            for (let i: number = 0; i < this.yellowUnits.length; i++) {
                const behaviorResult: UnitBehaviorResult = this.ProcessUnitBehavior(this.yellowUnits[i]);
                if (behaviorResult.success) {
                    this.actionStructs.push(behaviorResult.actionStruct);
                }
            }
        }

        return {
            playerNames: [],
            playerRanks: [],
            playerLoadouts: [],
            purpleWins: this.HasUnits(this.purpleUnits),
            actionStructs: this.actionStructs.map(x => x),
        } as FightStruct;
    }

    AddUnit(isPurple: boolean, gotoNode: FightNode, unitInfo: UnitInfo, cooldown: number = 0) {
        const unitFightInfo: UnitFightInfo = new UnitFightInfo(unitInfo, isPurple, gotoNode, cooldown);
        if (isPurple) {
            this.purpleUnits.push(unitFightInfo);
            gotoNode.unit = this.purpleUnits[this.purpleUnits.length - 1];
        }
        else {
            this.yellowUnits.push(unitFightInfo);
            gotoNode.unit = this.yellowUnits[this.yellowUnits.length - 1];
        }
    }

    RemoveUnit(unitFightInfo: UnitFightInfo) {
        if (unitFightInfo.isPurple) {
            const index: number = this.purpleUnits.indexOf(unitFightInfo);
            this.purpleUnits.splice(index, 1);
        }
        else {
            const index: number = this.yellowUnits.indexOf(unitFightInfo);
            this.yellowUnits.splice(index, 1);
        }

        const index: number = unitFightInfo.currentNode.bodies.indexOf(unitFightInfo);
        unitFightInfo.currentNode.bodies.splice(index, 1);
    }

    HasUnits(units: UnitFightInfo[]): boolean {
        for (let i: number = 0; i < units.length; i++) {
            if (units[i].currentHealth > 0) {
                return true;
            }
        }
        return false;
    }

    NodeWalkable(checkNode: FightNode, floats: boolean): boolean {
        return checkNode.unit == null && !checkNode.blocked && (floats || checkNode.tileType != TileType.Lava);
    }

    ProcessUnitBehavior(unitFightInfo: UnitFightInfo): UnitBehaviorResult {
        if (unitFightInfo.currentHealth <= 0) {
            unitFightInfo.deathDelay++;

            if (unitFightInfo.deathDelay > 20) {
                this.RemoveUnit(unitFightInfo);
            }

            return {
                success: false,
                actionStruct: new ActionStruct({
                    unitID: unitFightInfo.UnitID(),
                } as IActionStruct),
            } as UnitBehaviorResult;
        }

        let processedDelay: boolean = false;

        if (unitFightInfo.attackBuffDelay > 0) {
            unitFightInfo.attackBuffDelay--;
            processedDelay = true;
        }
        else {
            unitFightInfo.attackBuff = 0;
        }

        if (unitFightInfo.speedBuffDelay > 0) {
            unitFightInfo.speedBuffDelay--;
            processedDelay = true;
        }
        else {
            unitFightInfo.speedBuff = 0;
        }

        unitFightInfo.turnDelay += unitFightInfo.CurrentSpeed();
        if (unitFightInfo.turnDelay < (unitFightInfo.turnStep + 1) * 200) {
            return {
                success: processedDelay,
                actionStruct: new ActionStruct({
                    unitID: unitFightInfo.UnitID(),
                } as IActionStruct),
            } as UnitBehaviorResult;
        }
        else {
            unitFightInfo.turnStep++;
        }

        if (unitFightInfo.attackDelay > 0) {
            unitFightInfo.attackDelay--;
        }

        if (unitFightInfo.Reviver()) {
            unitFightInfo.targetNode = this.GetClosestBody(unitFightInfo);
        }
        else if (unitFightInfo.supports()) {
            unitFightInfo.targetNode = this.GetClosestAlly(unitFightInfo);
        }
        else {
            unitFightInfo.targetNode = this.GetClosestTarget(unitFightInfo);
        }

        if (unitFightInfo.targetNode == unitFightInfo.currentNode) {
            return {
                success: processedDelay,
                actionStruct: new ActionStruct({
                    unitID: unitFightInfo.UnitID(),
                } as IActionStruct),
            } as UnitBehaviorResult;
        }

        const distanceToTarget: number = Vector2.distance(unitFightInfo.currentNode.position, unitFightInfo.targetNode.position);

        if (!unitFightInfo.Reviver() && !unitFightInfo.supports()) {
            const tooClose: boolean = unitFightInfo.attackRange() > 1 && distanceToTarget <= unitFightInfo.attackRange() * 1.5;
            const shouldRun: boolean = !unitFightInfo.dontRun() && unitFightInfo.currentHealth <= unitFightInfo.MaxHealth() * .3;

            if ((shouldRun || tooClose) && unitFightInfo.justAttacked) {
                const gotoNode: FightNode = this.GetFurthestNode(unitFightInfo);

                if (gotoNode != unitFightInfo.currentNode) {
                    unitFightInfo.justAttacked = false;
                    this.MoveUnit(unitFightInfo, gotoNode);

                    return {
                        success: true,
                        actionStruct: new ActionStruct({
                            unitID: unitFightInfo.UnitID(),
                            moveToNode: gotoNode.position,
                        } as IActionStruct),
                    } as UnitBehaviorResult;
                }
            }
        }

        if (distanceToTarget <= unitFightInfo.attackRange() * 1.5) {
            if (unitFightInfo.attackDelay <= 0) {
                unitFightInfo.justAttacked = true;
                const targets: number[] = [];
                let finalNode: FightNode = unitFightInfo.targetNode;

                if (unitFightInfo.selfCast()) {
                    finalNode = unitFightInfo.currentNode;
                }

                let targetNode: FightNode = finalNode;
                if (unitFightInfo.areaOfEffect() > 0) {
                    const neighbourNodes: FightNode[] = this.GetAreaOfEffectNodes(finalNode, unitFightInfo.areaOfEffect());

                    for (let i: number = 0; i < neighbourNodes.length; i++) {
                        const actionOnNodeResult: ResolveActionOnNodeResult = this.ResolveActionOnNode(unitFightInfo, neighbourNodes[i]);
                        if (actionOnNodeResult.targetID != -1) {
                            targets.push(actionOnNodeResult.targetID);
                        }
                    }
                }
                else {
                    const actionOnNodeResult: ResolveActionOnNodeResult = this.ResolveActionOnNode(unitFightInfo, finalNode);

                    if (actionOnNodeResult.targetID != -1) {
                        targets.push(actionOnNodeResult.targetID);
                    }

                    targetNode = actionOnNodeResult.fightNode;
                }

                unitFightInfo.attackDelay += unitFightInfo.attackSpeed() + unitFightInfo.cooldown;
                if (!targetNode) {
                    return {
                        success: processedDelay,
                        actionStruct: new ActionStruct({
                            unitID: unitFightInfo.UnitID(),
                        } as IActionStruct),
                    } as UnitBehaviorResult;
                }
                else {
                    return {
                        success: true,
                        actionStruct: new ActionStruct({
                            unitID: unitFightInfo.UnitID(),
                            targetNode: targetNode.position,
                            targets: targets.map(x => x),
                            damage: Math.floor(unitFightInfo.CurrentDamage() / 10),
                        } as IActionStruct),
                    } as UnitBehaviorResult;
                }
            }
            else {
                if (!unitFightInfo.Reviver() && !unitFightInfo.supports()) {
                    return {
                        success: processedDelay,
                        actionStruct: new ActionStruct({
                            unitID: unitFightInfo.UnitID(),
                        } as IActionStruct),
                    } as UnitBehaviorResult;
                }

                const gotoNode: FightNode = this.GetClosestNode(unitFightInfo, unitFightInfo.targetNode);
                this.MoveUnit(unitFightInfo, gotoNode);

                return {
                    success: true,
                    actionStruct: new ActionStruct({
                        unitID: unitFightInfo.UnitID(),
                        moveToNode: gotoNode.position,
                    } as IActionStruct),
                } as UnitBehaviorResult;
            }
        }
        else {
            const gotoNode: FightNode = this.GetClosestNode(unitFightInfo, unitFightInfo.targetNode);
            this.MoveUnit(unitFightInfo, gotoNode);
            return {
                success: true,
                actionStruct: new ActionStruct({
                    unitID: unitFightInfo.UnitID(),
                    moveToNode: gotoNode.position,
                } as IActionStruct),
            } as UnitBehaviorResult;
        }
    }

    ResolveActionOnNode(unitFightInfo: UnitFightInfo, targetNode: FightNode): ResolveActionOnNodeResult {
        let returnNode: FightNode = targetNode;

        if (unitFightInfo.unitType() == UnitType.Druid) {
            const neighbourNodes: FightNode[] = this.GetFreeNeighbours(unitFightInfo.currentNode);

            if (neighbourNodes.length > 0) {
                this.AddSummonUnit(unitFightInfo, UnitType.Wolf, neighbourNodes[0]);
                returnNode = neighbourNodes[0];
            }
            else {
                returnNode = null;
            }

            return {
                targetID: -1,
                fightNode: returnNode,
            } as ResolveActionOnNodeResult;
        }

        if (unitFightInfo.unitType() == UnitType.TimeBender) {
            if (targetNode.unit != null) {
                if (this.XOR(!targetNode.unit.isPurple, unitFightInfo.isPurple)) {
                    targetNode.unit.speedBuff = 2;
                }
                else {
                    targetNode.unit.speedBuff = -2;
                }
                targetNode.unit.speedBuffDelay = 4;
            }

            return {
                targetID: -1,
                fightNode: returnNode,
            } as ResolveActionOnNodeResult;
        }

        if (unitFightInfo.unitType() == UnitType.Bard) {
            if (targetNode.unit != null) {
                if (this.XOR(!targetNode.unit.isPurple, unitFightInfo.isPurple)) {
                    targetNode.unit.attackBuff = 3;
                }
                else {
                    targetNode.unit.attackBuff = -3;
                }
                targetNode.unit.attackBuffDelay = 6;
            }

            return {
                targetID: -1,
                fightNode: returnNode,
            } as ResolveActionOnNodeResult;
        }

        if (unitFightInfo.Reviver()) {
            if (targetNode.bodies.length > 0) {
                const revivedUnit: UnitFightInfo = targetNode.bodies[0];
                if (revivedUnit.isPurple == unitFightInfo.isPurple) {
                    const neighbourNodes: FightNode[] = this.GetFreeNeighbours(targetNode);

                    if (neighbourNodes.length > 0) {
                        if (unitFightInfo.unitType() == UnitType.Priest) {
                            this.AddSummonUnit(unitFightInfo, revivedUnit.unitInfo.unitType, neighbourNodes[0], revivedUnit.cooldown + 1);
                        }
                        else if (unitFightInfo.unitType() == UnitType.Necromancer) {
                            this.AddSummonUnit(unitFightInfo, UnitType.Skeleton, neighbourNodes[0]);
                        }

                        const revivedUnitID: number = revivedUnit.UnitID();
                        this.RemoveUnit(revivedUnit);
                        returnNode = neighbourNodes[0];

                        return {
                            targetID: revivedUnitID,
                            fightNode: returnNode,
                        } as ResolveActionOnNodeResult;
                    }
                    else {
                        returnNode = null;
                    }
                }
                else {
                    returnNode = null;
                }
            }
            else {
                returnNode = null;
            }

            return {
                targetID: -1,
                fightNode: returnNode,
            } as ResolveActionOnNodeResult;
        }

        if (unitFightInfo.supports()) {
            if (targetNode.unit != null) {
                if (this.XOR(!targetNode.unit.isPurple, unitFightInfo.isPurple)) {
                    targetNode.unit.currentHealth += Math.floor(unitFightInfo.CurrentDamage() / 10);
                    if (targetNode.unit.currentHealth > targetNode.unit.MaxHealth()) {
                        targetNode.unit.currentHealth = targetNode.unit.MaxHealth();
                    }
                    unitFightInfo.cooldown++;
                    return {
                        targetID: targetNode.unit.UnitID(),
                        fightNode: returnNode,
                    } as ResolveActionOnNodeResult;
                }
            }

            return {
                targetID: -1,
                fightNode: returnNode,
            } as ResolveActionOnNodeResult;
        }

        if (targetNode.unit != null) {
            if (this.XOR(targetNode.unit.isPurple, unitFightInfo.isPurple)) {
                if (targetNode.unit.currentHealth > 0) {
                    const returnID: number = targetNode.unit.UnitID();
                    this.DamageUnit(targetNode.unit, Math.floor(unitFightInfo.CurrentDamage() / 10));

                    return {
                        targetID: returnID,
                        fightNode: returnNode,
                    } as ResolveActionOnNodeResult;
                }
            }
        }

        return {
            targetID: -1,
            fightNode: returnNode,
        } as ResolveActionOnNodeResult;
    }

    AddSummonUnit(unitFightInfo: UnitFightInfo, unitType: UnitType, gotoNode: FightNode, cooldown: number = 0) {
        const newID: number = unitFightInfo.UnitID() * -1 - 1000000 - unitFightInfo.cooldown * 1000000;
        const scriptableUnit: UnitData = getUnitByType(unitType);

        const unitInfo: UnitInfo = {
            unitID: newID,
            unitType: scriptableUnit.unit_type,
            speed: scriptableUnit.speed,
            damage: scriptableUnit.damage,
            health: scriptableUnit.health,
        };

        this.AddUnit(unitFightInfo.isPurple, gotoNode, unitInfo);
        unitFightInfo.cooldown++;
    }

    XOR(x: boolean, y: boolean): boolean {
        return x != y;
    }

    MoveUnit(unitFightInfo: UnitFightInfo, gotoNode: FightNode) {
        unitFightInfo.currentNode.unit = null;
        unitFightInfo.currentNode = gotoNode;
        unitFightInfo.currentNode.unit = unitFightInfo;
    }

    DamageUnit(unit: UnitFightInfo, damage: number) {
        unit.currentHealth -= damage;

        if (unit.currentHealth <= 0) {
            unit.currentNode.bodies.push(unit);
            unit.currentNode.unit = null;
        }
    }

    GetClosestBody(fromUnit: UnitFightInfo): FightNode {
        const targetNodes: FightNode[] = [];
        if (fromUnit.isPurple) {
            for (let i: number = 0; i < this.purpleUnits.length; i++) {
                const unit: UnitFightInfo = this.purpleUnits[i];
                if (unit.currentHealth > 0 || unit.UnitID() == fromUnit.UnitID() || unit.supports()) {
                    continue;
                }
                targetNodes.push(unit.currentNode);
            }
        }
        else {
            for (let i: number = 0; i < this.yellowUnits.length; i++) {
                const unit: UnitFightInfo = this.yellowUnits[i];
                if (unit.currentHealth > 0 || unit.UnitID() == fromUnit.UnitID() || unit.supports()) {
                    continue;
                }
                targetNodes.push(unit.currentNode);
            }
        }

        if (targetNodes.length == 0) {
            return fromUnit.currentNode;
        }

        targetNodes.sort((left, right) => Vector2.compare(left.position, right.position, fromUnit.currentNode.position));
        return targetNodes[0];
    }

    GetClosestAlly(fromUnit: UnitFightInfo): FightNode {
        const targetNodes: FightNode[] = [];
        if (fromUnit.isPurple) {
            for (let i: number = 0; i < this.purpleUnits.length; i++) {
                const unit: UnitFightInfo = this.purpleUnits[i];
                if (unit.currentHealth <= 0 || unit.UnitID() == fromUnit.UnitID() || unit.supports()) {
                    continue;
                }
                targetNodes.push(unit.currentNode);
            }
        }
        else {
            for (let i: number = 0; i < this.yellowUnits.length; i++) {
                const unit: UnitFightInfo = this.yellowUnits[i];
                if (unit.currentHealth <= 0 || unit.UnitID() == fromUnit.UnitID() || unit.supports()) {
                    continue;
                }
                targetNodes.push(unit.currentNode);
            }
        }

        if (targetNodes.length == 0) {
            return fromUnit.currentNode;
        }

        targetNodes.sort((left, right) => Vector2.compare(left.position, right.position, fromUnit.currentNode.position));
        return targetNodes[0];
    }

    GetClosestTarget(fromUnit: UnitFightInfo): FightNode {
        const targetNodes: FightNode[] = [];
        if (!fromUnit.isPurple) {
            for (let i: number = 0; i < this.purpleUnits.length; i++) {
                const unit: UnitFightInfo = this.purpleUnits[i];
                if (unit.currentHealth <= 0) {
                    continue;
                }
                targetNodes.push(unit.currentNode);
            }
        }
        else {
            for (let i: number = 0; i < this.yellowUnits.length; i++) {
                const unit: UnitFightInfo = this.yellowUnits[i];
                if (unit.currentHealth <= 0) {
                    continue;
                }
                targetNodes.push(unit.currentNode);
            }
        }

        if (targetNodes.length == 0) {
            return fromUnit.currentNode;
        }

        targetNodes.sort((left, right) => Vector2.compare(left.position, right.position, fromUnit.currentNode.position));
        return targetNodes[0];
    }

    GetClosestNode(unit: UnitFightInfo, targetNode: FightNode): FightNode {
        const neighbourNodes: FightNode[] = this.GetFreeNeighbours(unit.currentNode, unit.Floats());
        if (neighbourNodes.length > 0) {
            neighbourNodes.sort((left, right) => Vector2.compare(left.position, right.position, targetNode.position));
            return neighbourNodes[0];
        }
        return unit.currentNode;
    }

    GetFurthestNode(unit: UnitFightInfo): FightNode {
        const neighbourNodes: FightNode[] = this.GetFreeNeighbours(unit.currentNode, unit.Floats());
        if (neighbourNodes.length > 0) {
            neighbourNodes.sort((left, right) => Vector2.compare(left.position, right.position, unit.targetNode.position));
            return neighbourNodes[neighbourNodes.length - 1];
        }
        return unit.currentNode;
    }

    GetAreaOfEffectNodes(fromNode: FightNode, searchRange: number): FightNode[] {
        const neighbourNodes: FightNode[] = [];
        if (searchRange == 0) {
            neighbourNodes.push(fromNode);
            return neighbourNodes;
        }
        let xRange: number = 0;
        for (let y: number = -searchRange; y <= searchRange; y++) {
            for (let x: number = -xRange; x <= xRange; x++) {
                const goX: number = fromNode.position.x + x;
                const goY: number = fromNode.position.y + y;
                if (!OutOfBounds(goX, goY)) {
                    if (!this.nodeGrid[goX][goY].blocked) {
                        neighbourNodes.push(this.nodeGrid[goX][goY]);
                    }
                }
            }
            if (y < 0) {
                xRange++;
            }
            else {
                xRange--;
            }
        }
        return neighbourNodes;
    }

    GetFreeNeighbours(fromNode: FightNode, floats: boolean = false): FightNode[] {
        const neighbourNodes: FightNode[] = [];
        for (let x: number = -1; x <= 1; x++) {
            for (let y: number = -1; y <= 1; y++) {
                if (x == 0 && y == 0) {
                    continue;
                }

                const goX: number = fromNode.position.x + x;
                const goY: number = fromNode.position.y + y;

                if (!OutOfBounds(goX, goY) &&
                    this.NodeWalkable(this.nodeGrid[goX][goY], floats)) {
                    neighbourNodes.push(this.nodeGrid[goX][goY]);
                }
            }
        }
        return neighbourNodes;
    }
}