import { useState } from 'react';
import { Button, Form, Modal, Select, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { orderService } from '@services/api';

const { Option } = Select;

export default function ModalCreateOrder({ products }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [form] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const handleCloseModal = () => {
    setShowModal(false);
    form.resetFields();
    setTotal(0);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const onCreate = async (values) => {
    try {
      setLoading(true);
      const response = await orderService.create({
        ...values,
        products: [values.products],
        total,
      });
      successMsg(response.message);
      handleCloseModal();
      router.reload();
    } catch (error) {
      errorMsg(error?.response?.data?.message || 'Error al crear la orden.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total and set price and stock when product changes
  const handleProductsChange = (selectedProductId) => {
    const selectedProduct = products.find((p) => p.id === selectedProductId);
    const unitPrice = selectedProduct ? selectedProduct.price : 0;
    const quantity = form.getFieldValue('quantity') || 1;
    const calculatedTotal = unitPrice * quantity;
    setTotal(calculatedTotal);
    form.setFieldsValue({
      total: calculatedTotal,
      price: unitPrice,
      availableStock: selectedProduct ? selectedProduct.quantity : 0,
    });
    // Update change if paid_amount is set
    const paidAmount = form.getFieldValue('paid_amount') || 0;
    if (paidAmount > calculatedTotal) {
      const changeAmount = paidAmount - calculatedTotal;
      form.setFieldsValue({ change: changeAmount });
    } else {
      form.setFieldsValue({ change: 0 });
    }
  };

  // Recalculate total when quantity changes
  const handleQuantityChange = (value) => {
    const quantity = value || 1;
    const unitPrice = form.getFieldValue('price') || 0;
    const calculatedTotal = unitPrice * quantity;
    setTotal(calculatedTotal);
    form.setFieldsValue({ total: calculatedTotal });
    // Also update change if paid_amount is set
    const paidAmount = form.getFieldValue('paid_amount') || 0;
    if (paidAmount > calculatedTotal) {
      const changeAmount = paidAmount - calculatedTotal;
      form.setFieldsValue({ change: changeAmount });
    } else {
      form.setFieldsValue({ change: 0 });
    }
  };

  // Auto-fill change when paid_amount changes
  const handlePaidAmountChange = (value) => {
    const paidAmount = value || 0;
    if (paidAmount > total) {
      const changeAmount = paidAmount - total;
      form.setFieldsValue({ change: changeAmount });
    } else {
      form.setFieldsValue({ change: 0 });
    }
  };

  return (
    <>
      <Button onClick={handleOpenModal} className="mx-2" icon={<PlusOutlined />} type="primary">
        Crear Venta
      </Button>
      <Modal
        title="Crear Venta"
        open={showModal}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onCreate} autoComplete="off" preserve={false}>
          <Form.Item
            label="Productos"
            name="products"
            rules={[
              {
                required: true,
                message: 'Por favor seleccione un producto.',
              },
            ]}
          >
            <Select
              placeholder="Seleccione un producto"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={handleProductsChange}
            >
              {products?.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} - {product.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Precio unitario del producto" name="price">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled />
          </Form.Item>

          <Form.Item label="Stock disponible" name="availableStock">
            <InputNumber style={{ width: '100%' }} min={0} disabled />
          </Form.Item>

          <Form.Item
            label="Cantidad a vender"
            name="quantity"
            rules={[
              {
                required: true,
                message: 'Por favor ingrese la cantidad.',
              },
              {
                type: 'number',
                min: 1,
                message: 'La cantidad debe ser mayor o igual a 1.',
              },
            ]}
          >
            <InputNumber
              placeholder="Ingrese la cantidad a vender"
              style={{ width: '100%' }}
              min={1}
              onChange={handleQuantityChange}
            />
          </Form.Item>

          <Form.Item
            label="Método de Pago"
            name="payment_method"
            rules={[
              {
                required: true,
                message: 'Por favor seleccione el método de pago.',
              },
            ]}
            initialValue="efectivo"
          >
            <Select placeholder="Seleccione método de pago" allowClear>
              <Option value="efectivo">Efectivo</Option>
              <Option value="tarjeta">Tarjeta</Option>
              <Option value="transferencia">Transferencia</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Monto Pagado $"
            name="paid_amount"
            rules={[
              {
                type: 'number',
                min: 0,
                message: 'El monto pagado debe ser mayor o igual a 0.',
              },
            ]}
          >
            <InputNumber
              placeholder="Ingrese el monto pagado"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              onChange={handlePaidAmountChange}
            />
          </Form.Item>

          <Form.Item
            label="Vuelto $ | Monto pagado - (Precio unitario del producto * Cantidad a vender)"
            name="change"
            rules={[
              {
                type: 'number',
                min: 0,
                message: 'El vuelto debe ser mayor o igual a 0.',
              },
            ]}
          >
            <InputNumber
              placeholder="Vuelto calculado automáticamente"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              disabled
            />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Crear Venta
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
