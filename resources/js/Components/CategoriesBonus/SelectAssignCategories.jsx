import { router } from '@inertiajs/react';
import { Button, Select } from 'antd';
import React, { useState } from 'react';
import { useMessage } from '@contexts/MessageShow';
import { categoryBonusService } from '@services/api';

const { Option } = Select;

export const SelectAssignCategories = ({
    setSelectedRowKeys,
    selectedRowKeys,
    categories,
}) => {
    const { successMsg, errorMsg } = useMessage();
    const [selectCategoryId, setSelectCategoryId] = useState(null);

    const handleAssignCategories = async () => {
        try {
            const response = await categoryBonusService.assignMultipleUsers(
                selectedRowKeys,
                selectCategoryId
            );
            if (response.success) {
                successMsg(response.message);
                router.visit('/users', {
                    preserveState: true,
                });
                setSelectCategoryId(null);
                setSelectedRowKeys([]);
            } else {
                errorMsg(response.message);
            }
        } catch (error) {
            errorMsg('Error al asignar categorías');
        }
    };
    return (
        <>
            {selectedRowKeys.length > 0 && (
                <div className=" flex gap-5">
                    <Select
                        placeholder="Seleccionar categoria de bono"
                        onChange={(value) => setSelectCategoryId(value)}
                        style={{ width: 300 }}
                    >
                        {categories?.map((category) => (
                            <Option key={category.id} value={category.id}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>

                    <Button
                        disabled={!selectCategoryId}
                        onClick={() => handleAssignCategories()}
                    >
                        Asignar categoria
                    </Button>
                </div>
            )}
        </>
    );
};
