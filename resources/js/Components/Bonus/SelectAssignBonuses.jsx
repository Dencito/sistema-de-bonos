import { router } from '@inertiajs/react';
import { Button, Select } from 'antd';
import React, { useState } from 'react';
import { useMessage } from '@contexts/MessageShow';
import { bonusService } from '@services/api';

const { Option } = Select;

export const SelectAssignBonuses = ({
    setSelectedRowKeys,
    selectedRowKeys,
    bonuses,
}) => {
    const { successMsg, errorMsg } = useMessage();
    const [selectBonusId, setSelectBonusId] = useState(null);

    const handleAssignBonuses = async () => {
        try {
            const response = await bonusService.assignMultipleUsers(
                selectedRowKeys,
                selectBonusId
            );
            if (response.success) {
                successMsg(response.message);
                router.visit('/users', {
                    preserveState: true,
                });
                setSelectBonusId(null);
                setSelectedRowKeys([]);
            } else {
                errorMsg(response.message);
            }
        } catch (error) {
            errorMsg('Error al asignar bonos');
        }
    };

    const handleDestroyBonuses = async () => {
        try {
            const response = await bonusService.destroyMultipleUsers(
                selectedRowKeys,
                selectBonusId
            );
            if (response.success) {
                successMsg(response.message);
                router.visit('/users', {
                    preserveState: true,
                });
                setSelectBonusId(null);
                setSelectedRowKeys([]);
            } else {
                errorMsg(response.message);
            }
        } catch (error) {
            errorMsg('Error al eliminar bonos');
        }
    };
    return (
        <>
            {selectedRowKeys.length > 0 && (
                <div className="flex flex-col md:flex-row gap-5">
                    <Select
                        placeholder="Seleccionar bono"
                        onChange={(value) => setSelectBonusId(value)}
                        style={{ width: 300 }}
                    >
                        {bonuses?.map((bonus) => (
                            <Option key={bonus.id} value={bonus.id}>
                                {bonus.name}
                            </Option>
                        ))}
                    </Select>

                    <Button
                        disabled={!selectBonusId}
                        onClick={() => handleAssignBonuses()}
                    >
                        Asignar bonos
                    </Button>

                    <Button
                        disabled={!selectBonusId}
                        onClick={() => handleDestroyBonuses()}
                    >
                        sacar bonos
                    </Button>
                </div>
            )}
        </>
    );
};
